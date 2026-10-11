use libloading::Library;
use std::ffi::{c_char, c_int, c_void, CStr, CString};

// Transcribed from mpv's `mpv_format` and `mpv_event_id` enums in
// include/mpv/client.h (client API 2.5). Neither enum is contiguous and both
// contain gaps for retired members, so a plausible-looking guess reads the
// wrong union member or silently drops an event stream. The full sets are kept
// here on purpose - reference them here rather than guessing.
#[allow(dead_code)]
mod enum_values {
    use std::ffi::c_int;

    pub const MPV_FORMAT_NONE: c_int = 0;
    pub const MPV_FORMAT_STRING: c_int = 1;
    pub const MPV_FORMAT_OSD_STRING: c_int = 2;
    pub const MPV_FORMAT_FLAG: c_int = 3;
    pub const MPV_FORMAT_INT64: c_int = 4;
    pub const MPV_FORMAT_DOUBLE: c_int = 5;
    pub const MPV_FORMAT_NODE: c_int = 6;
    pub const MPV_FORMAT_NODE_ARRAY: c_int = 7;
    pub const MPV_FORMAT_NODE_MAP: c_int = 8;
    pub const MPV_FORMAT_BYTE_ARRAY: c_int = 9;

    pub const MPV_EVENT_NONE: c_int = 0;
    pub const MPV_EVENT_SHUTDOWN: c_int = 1;
    pub const MPV_EVENT_LOG_MESSAGE: c_int = 2;
    pub const MPV_EVENT_GET_PROPERTY_REPLY: c_int = 3;
    pub const MPV_EVENT_SET_PROPERTY_REPLY: c_int = 4;
    pub const MPV_EVENT_COMMAND_REPLY: c_int = 5;
    pub const MPV_EVENT_START_FILE: c_int = 6;
    pub const MPV_EVENT_END_FILE: c_int = 7;
    pub const MPV_EVENT_FILE_LOADED: c_int = 8;
    pub const MPV_EVENT_TRACKS_CHANGED: c_int = 9;
    pub const MPV_EVENT_META_CHANGED: c_int = 10;
    pub const MPV_EVENT_IDLE: c_int = 11;
    pub const MPV_EVENT_PAUSE: c_int = 12;
    pub const MPV_EVENT_UNPAUSE: c_int = 13;
    pub const MPV_EVENT_TICK: c_int = 14;
    pub const MPV_EVENT_CLIENT_MESSAGE: c_int = 16;
    pub const MPV_EVENT_VIDEO_RECONFIG: c_int = 17;
    pub const MPV_EVENT_AUDIO_RECONFIG: c_int = 18;
    pub const MPV_EVENT_SEEK: c_int = 20;
    pub const MPV_EVENT_PLAYBACK_RESTART: c_int = 21;
    pub const MPV_EVENT_PROPERTY_CHANGE: c_int = 22;
    pub const MPV_EVENT_QUEUE_OVERFLOW: c_int = 24;
    pub const MPV_EVENT_HOOK: c_int = 25;
}

pub use enum_values::*;

#[repr(C)]
#[derive(Clone, Copy)]
pub struct MpvEvent {
    pub event_id: c_int,
    pub error: c_int,
    pub reply_userdata: u64,
    pub data: *mut c_void,
}

#[repr(C)]
pub struct MpvEventProperty {
    pub name: *mut c_char,
    pub format: c_int,
    pub data: *mut c_void,
}

#[repr(C)]
pub struct MpvEventLogMessage {
    pub prefix: *mut c_char,
    pub level: *mut c_char,
    pub text: *mut c_char,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct MpvNodeList {
    pub num: c_int,
    pub values: *mut MpvNode,
    pub keys: *mut *mut c_char,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub union MpvNodeUnion {
    pub string: *mut c_char,
    pub list: *mut MpvNodeList,
    pub int64: i64,
    pub double: f64,
    pub flag: c_int,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct MpvNode {
    pub format: c_int,
    pub u: MpvNodeUnion,
}

#[repr(C)]
pub struct MpvNodeMap {
    pub num: c_int,
    pub keys: *mut *mut c_char,
    pub values: *mut MpvNode,
}

type MpvCreateFn = unsafe extern "C" fn() -> *mut c_void;
type MpvInitializeFn = unsafe extern "C" fn(*mut c_void) -> c_int;
type MpvDestroyFn = unsafe extern "C" fn(*mut c_void);
type MpvSetOptionStringFn = unsafe extern "C" fn(*mut c_void, *const c_char, *const c_char) -> c_int;
type MpvSetPropertyStringFn = unsafe extern "C" fn(*mut c_void, *const c_char, *const c_char) -> c_int;
type MpvObservePropertyFn =
    unsafe extern "C" fn(*mut c_void, u64, *const c_char, c_int) -> c_int;
type MpvCommandStringFn = unsafe extern "C" fn(*mut c_void, *const c_char) -> c_int;
type MpvGetPropertyFn =
    unsafe extern "C" fn(*mut c_void, *const c_char, c_int, *mut c_void) -> c_int;
type MpvWaitEventFn = unsafe extern "C" fn(*mut c_void, f64) -> *mut MpvEvent;
type MpvFreeFn = unsafe extern "C" fn(*mut c_void);
type MpvSetWakeupCallbackFn =
    unsafe extern "C" fn(*mut c_void, Option<extern "C" fn(*mut c_void)>, *mut c_void);
type MpvRequestLogMessagesFn = unsafe extern "C" fn(*mut c_void, *const c_char);

struct MpvApi {
    _lib: Library,
    create: MpvCreateFn,
    initialize: MpvInitializeFn,
    destroy: MpvDestroyFn,
    set_option_string: MpvSetOptionStringFn,
    set_property_string: MpvSetPropertyStringFn,
    observe_property: MpvObservePropertyFn,
    command_string: MpvCommandStringFn,
    get_property: MpvGetPropertyFn,
    wait_event: MpvWaitEventFn,
    free: MpvFreeFn,
    set_wakeup_callback: MpvSetWakeupCallbackFn,
    request_log_messages: MpvRequestLogMessagesFn,
}

fn candidate_paths() -> Vec<String> {
    #[cfg(windows)]
    const NAMES: [&str; 5] = [
        "libmpv-2.dll",
        "mpv-2.dll",
        "libmpv-1.dll",
        "mpv-1.dll",
        "libmpv-2.dll.0",
    ];
    #[cfg(not(windows))]
    const NAMES: [&str; 4] = ["libmpv.so.2", "libmpv.so", "libmpv.dylib", "libmpv.2.dylib"];

    let mut out = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            for sub in ["binaries", "."] {
                for name in NAMES {
                    out.push(dir.join(sub).join(name).to_string_lossy().to_string());
                }
            }
        }
    }
    for name in NAMES {
        out.push(name.to_string());
    }
    out
}

fn load_library() -> Result<MpvApi, String> {
    let mut last_err = String::from("no candidate attempted");
    for path in candidate_paths() {
        match unsafe { Library::new(&path) } {
            Ok(lib) => {
                // `Symbol<T>` derefs to the function pointer it resolved to, so
                // a missing export is a normal Err rather than a transmute.
                macro_rules! sym {
                    ($name:literal, $ty:ty) => {
                        *lib.get::<$ty>(concat!($name, "\0").as_bytes())
                            .map_err(|e| format!("{} missing in {path}: {e}", $name))?
                    };
                }
                unsafe {
                    return Ok(MpvApi {
                        create: sym!("mpv_create", MpvCreateFn),
                        initialize: sym!("mpv_initialize", MpvInitializeFn),
                        destroy: sym!("mpv_destroy", MpvDestroyFn),
                        set_option_string: sym!("mpv_set_option_string", MpvSetOptionStringFn),
                        set_property_string: sym!("mpv_set_property_string", MpvSetPropertyStringFn),
                        observe_property: sym!("mpv_observe_property", MpvObservePropertyFn),
                        command_string: sym!("mpv_command_string", MpvCommandStringFn),
                        get_property: sym!("mpv_get_property", MpvGetPropertyFn),
                        wait_event: sym!("mpv_wait_event", MpvWaitEventFn),
                        free: sym!("mpv_free", MpvFreeFn),
                        set_wakeup_callback: sym!("mpv_set_wakeup_callback", MpvSetWakeupCallbackFn),
                        request_log_messages: sym!(
                            "mpv_request_log_messages",
                            MpvRequestLogMessagesFn
                        ),
                        _lib: lib,
                    });
                }
            }
            Err(e) => last_err = format!("{path}: {e}"),
        }
    }
    Err(format!("could not load libmpv ({last_err})"))
}

pub struct MpvHandle {
    api: &'static MpvApi,
    ctx: *mut c_void,
}

unsafe impl Send for MpvHandle {}
unsafe impl Sync for MpvHandle {}

static API: std::sync::OnceLock<Result<&'static MpvApi, String>> = std::sync::OnceLock::new();

fn cstr(s: &str) -> CString {
    CString::new(s).unwrap_or_else(|_| CString::new("").unwrap())
}

impl MpvHandle {
    pub fn new() -> Result<Self, String> {
        let result = API.get_or_init(|| match load_library() {
            Ok(api) => Ok(Box::leak(Box::new(api))),
            Err(e) => Err(e),
        });
        let api = match result {
            Ok(api) => *api,
            Err(e) => return Err(e.clone()),
        };

        unsafe {
            let ctx = (api.create)();
            if ctx.is_null() {
                return Err("mpv_create returned null".into());
            }
            let rv = (api.initialize)(ctx);
            if rv < 0 {
                (api.destroy)(ctx);
                return Err(format!("mpv_initialize failed ({rv})"));
            }
            Ok(Self {
                api,
                ctx,
            })
        }
    }

    pub fn set_option(&self, name: &str, value: &str) -> Result<(), String> {
        unsafe {
            let rv = (self.api.set_option_string)(self.ctx, cstr(name).as_ptr(), cstr(value).as_ptr());
            if rv < 0 {
                return Err(format!("set_option {name}={value} failed ({rv})"));
            }
        }
        Ok(())
    }

    pub fn set_property(&self, name: &str, value: &str) {
        unsafe {
            (self.api.set_property_string)(self.ctx, cstr(name).as_ptr(), cstr(value).as_ptr());
        }
    }

    pub fn command(&self, cmd: &str) {
        unsafe {
            (self.api.command_string)(self.ctx, cstr(cmd).as_ptr());
        }
    }

    pub fn get_string(&self, name: &str) -> Option<String> {
        unsafe {
            let mut out: *mut c_char = std::ptr::null_mut();
            let rv = (self.api.get_property)(
                self.ctx,
                cstr(name).as_ptr(),
                MPV_FORMAT_STRING,
                &mut out as *mut *mut c_char as *mut c_void,
            );
            if rv < 0 || out.is_null() {
                return None;
            }
            let s = CStr::from_ptr(out).to_string_lossy().into_owned();
            (self.api.free)(out as *mut c_void);
            Some(s)
        }
    }

    pub fn get_double(&self, name: &str) -> Option<f64> {
        unsafe {
            let mut out: f64 = 0.0;
            let rv = (self.api.get_property)(
                self.ctx,
                cstr(name).as_ptr(),
                MPV_FORMAT_DOUBLE,
                &mut out as *mut f64 as *mut c_void,
            );
            if rv < 0 {
                None
            } else {
                Some(out)
            }
        }
    }

    pub fn observe(&self, id: u64, name: &str, format: c_int) {
        unsafe {
            let rv =
                (self.api.observe_property)(self.ctx, id, cstr(name).as_ptr(), format);
            if rv < 0 {
                // A rejected observation never delivers an event, so it looks
                // exactly like a property that never changes.
                crate::log::line(&format!(
                    "observe_property {name} (fmt {format}) failed ({rv})"
                ));
            }
        }
    }

    pub fn wait_event(&self, timeout: f64) -> Option<MpvEvent> {
        unsafe {
            let ptr = (self.api.wait_event)(self.ctx, timeout);
            if ptr.is_null() {
                return None;
            }
            Some(*ptr)
        }
    }

    pub fn set_wakeup(&self, cb: extern "C" fn(*mut c_void), userdata: *mut c_void) {
        unsafe {
            (self.api.set_wakeup_callback)(self.ctx, Some(cb), userdata);
        }
    }

    pub fn request_logs(&self, level: &str) {
        unsafe {
            (self.api.request_log_messages)(self.ctx, cstr(level).as_ptr());
        }
    }

    pub fn get_flag(&self, name: &str) -> Option<bool> {
        unsafe {
            let mut out: c_int = 0;
            let rv = (self.api.get_property)(
                self.ctx,
                cstr(name).as_ptr(),
                MPV_FORMAT_FLAG,
                &mut out as *mut c_int as *mut c_void,
            );
            if rv < 0 {
                None
            } else {
                Some(out != 0)
            }
        }
    }

    pub fn get_node(&self, name: &str) -> Option<*mut MpvNode> {
        unsafe {
            let mut node: *mut MpvNode = std::ptr::null_mut();
            let rv = (self.api.get_property)(
                self.ctx,
                cstr(name).as_ptr(),
                MPV_FORMAT_NODE,
                &mut node as *mut *mut MpvNode as *mut c_void,
            );
            if rv < 0 || node.is_null() {
                None
            } else {
                Some(node)
            }
        }
    }

    pub fn free_node(&self, node: *mut MpvNode) {
        unsafe {
            (self.api.free)(node as *mut c_void);
        }
    }

    pub fn node_list(node: &MpvNode) -> Option<&'static MpvNodeList> {
        if node.format == MPV_FORMAT_NODE_ARRAY && unsafe { !node.u.list.is_null() } {
            unsafe { Some(&*node.u.list) }
        } else {
            None
        }
    }

    pub fn node_map(node: &MpvNode) -> Option<&'static MpvNodeMap> {
        if node.format == MPV_FORMAT_NODE_MAP && unsafe { !node.u.list.is_null() } {
            unsafe { Some(&*(node.u.list as *const MpvNodeMap)) }
        } else {
            None
        }
    }

    pub fn node_string(node: &MpvNode) -> String {
        if unsafe { node.u.string.is_null() } {
            String::new()
        } else {
            unsafe { CStr::from_ptr(node.u.string).to_string_lossy().into_owned() }
        }
    }

    pub fn node_int64(node: &MpvNode) -> i64 {
        unsafe { node.u.int64 }
    }

    pub fn node_double(node: &MpvNode) -> f64 {
        unsafe { node.u.double }
    }

    pub fn node_flag(node: &MpvNode) -> c_int {
        unsafe { node.u.flag }
    }
}

impl Drop for MpvHandle {
    fn drop(&mut self) {
        unsafe {
            (self.api.destroy)(self.ctx);
        }
    }
}
// These mirror the Win32 SDK's own spelling; renaming them would make the
// declarations harder to check against the documentation.
#![allow(non_snake_case, non_camel_case_types)]
#![allow(clippy::upper_case_acronyms)]

use std::ffi::c_void;
use std::os::raw::c_int;

pub type HWND = *mut c_void;
pub type HINSTANCE = *mut c_void;
pub type HBRUSH = *mut c_void;
pub type WPARAM = usize;
pub type LPARAM = isize;
pub type LRESULT = isize;
pub type WNDPROC = unsafe extern "system" fn(HWND, u32, WPARAM, LPARAM) -> LRESULT;

const WS_CHILD: u32 = 0x4000_0000;
const WS_CLIPCHILDREN: u32 = 0x0200_0000;
const WS_CLIPSIBLINGS: u32 = 0x0400_0000;
const SW_SHOWNOACTIVATE: c_int = 4;

// Never steal focus, and let every click fall through to the UI underneath.
const WS_EX_TRANSPARENT: u32 = 0x0000_0020;
const WS_EX_NOACTIVATE: u32 = 0x0800_0000;

const SWP_NOZORDER: u32 = 0x0004;
const SWP_NOACTIVATE: u32 = 0x0010;
const SWP_SHOWWINDOW: u32 = 0x0040;

const CLASS_NAME: &str = "AnkyloVideoHost";
const WINDOW_TITLE: &str = "AnkyloVideo";

#[repr(C)]
struct WNDCLASSW {
    style: u32,
    lpfnWndProc: WNDPROC,
    cbClsExtra: i32,
    cbWndExtra: i32,
    hInstance: HINSTANCE,
    hIcon: HINSTANCE,
    hCursor: HINSTANCE,
    hbrBackground: HBRUSH,
    lpszMenuName: *const u16,
    lpszClassName: *const u16,
}

extern "system" {
    fn GetModuleHandleW(lpmodulename: *const u16) -> HINSTANCE;
    fn RegisterClassW(lpwcx: *const WNDCLASSW) -> u16;
    fn CreateWindowExW(
        dwExStyle: u32,
        lpClassName: *const u16,
        lpWindowName: *const u16,
        dwStyle: u32,
        x: c_int,
        y: c_int,
        nWidth: c_int,
        nHeight: c_int,
        hWndParent: HWND,
        hMenu: *mut c_void,
        hInstance: HINSTANCE,
        lpParam: *mut c_void,
    ) -> HWND;
    fn MoveWindow(hwnd: HWND, x: c_int, y: c_int, w: c_int, h: c_int, repaint: bool) -> bool;
    fn SetWindowPos(
        hwnd: HWND,
        hWndInsertAfter: HWND,
        x: c_int,
        y: c_int,
        cx: c_int,
        cy: c_int,
        uFlags: u32,
    ) -> bool;
    fn ShowWindow(hwnd: HWND, nCmdShow: c_int) -> bool;
    fn DestroyWindow(hwnd: HWND) -> bool;
}

unsafe extern "system" fn wnd_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    DefWindowProcW(hwnd, msg, wparam, lparam)
}

extern "system" {
    #[link_name = "DefWindowProcW"]
    fn DefWindowProcW(hwnd: HWND, msg: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT;
}

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

pub struct VideoWindow {
    hwnd: isize,
}

unsafe impl Send for VideoWindow {}
unsafe impl Sync for VideoWindow {}

impl VideoWindow {
    pub fn create(parent: isize) -> Self {
        unsafe {
            let hinstance = GetModuleHandleW(std::ptr::null());
            if hinstance.is_null() {
                return Self { hwnd: 0 };
            }

            let class_name = wide(CLASS_NAME);
            let wc = WNDCLASSW {
                style: 0,
                lpfnWndProc: wnd_proc,
                cbClsExtra: 0,
                cbWndExtra: 0,
                hInstance: hinstance,
                hIcon: std::ptr::null_mut(),
                hCursor: std::ptr::null_mut(),
                hbrBackground: std::ptr::null_mut(),
                lpszMenuName: std::ptr::null(),
                lpszClassName: class_name.as_ptr(),
            };

            if RegisterClassW(&wc) == 0 {
                return Self { hwnd: 0 };
            }

            let title = wide(WINDOW_TITLE);
            let hwnd = CreateWindowExW(
                WS_EX_TRANSPARENT | WS_EX_NOACTIVATE,
                class_name.as_ptr(),
                title.as_ptr(),
                WS_CHILD | WS_CLIPCHILDREN | WS_CLIPSIBLINGS,
                0,
                0,
                16,
                16,
                parent as HWND,
                std::ptr::null_mut(),
                hinstance,
                std::ptr::null_mut(),
            );

            if hwnd.is_null() {
                return Self { hwnd: 0 };
            }

            let raw = hwnd as isize;
            ShowWindow(hwnd, SW_SHOWNOACTIVATE);

            Self { hwnd: raw }
        }
    }

    pub fn hwnd(&self) -> isize {
        self.hwnd
    }

    pub fn move_to(&self, x: i32, y: i32, w: i32, h: i32) {
        if self.hwnd == 0 {
            return;
        }
        if w < 1 || h < 1 {
            self.hide();
            return;
        }
        unsafe {
            let hwnd = self.hwnd as HWND;
            MoveWindow(hwnd, x, y, w, h, true);
            SetWindowPos(hwnd, std::ptr::null_mut(), x, y, w, h, SWP_NOACTIVATE | SWP_SHOWWINDOW);
        }
    }

    pub fn hide(&self) {
        if self.hwnd == 0 {
            return;
        }
        unsafe {
            let hwnd = self.hwnd as HWND;
            MoveWindow(hwnd, 0, 0, 0, 0, true);
            SetWindowPos(
                hwnd,
                std::ptr::null_mut(),
                0,
                0,
                0,
                0,
                SWP_NOACTIVATE | SWP_NOZORDER,
            );
        }
    }
}

impl Drop for VideoWindow {
    fn drop(&mut self) {
        if self.hwnd == 0 {
            return;
        }
        unsafe {
            DestroyWindow(self.hwnd as HWND);
        }
    }
}

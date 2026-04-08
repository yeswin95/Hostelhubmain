function resolveApiBaseUrl() {
    if (window.HOSTELHUB_API_URL) {
        return window.HOSTELHUB_API_URL;
    }

    const { protocol, hostname, port, origin } = window.location;
    const isHttp = protocol === "http:" || protocol === "https:";
    const isBackendPort = port === "5000" || port === "5001";

    // If frontend is served by backend, keep same-origin API calls.
    if (isHttp && isBackendPort) {
        return `${origin}/api`;
    }

    // If frontend is served by Live Server/file preview, use local backend.
    return `http://${hostname || "localhost"}:5001/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

function getAuthToken() {
    return localStorage.getItem("authToken");
}

function setAuthSession(token, user) {
    localStorage.setItem("authToken", token);
    localStorage.setItem("currentUserProfile", JSON.stringify(user));
    localStorage.setItem("currentUser", user.email);
    localStorage.setItem("userRole", user.role);
}

function clearAuthSession() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUserProfile");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
}

async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }
    return data;
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUserProfile"));
    } catch (_e) {
        return null;
    }
}

async function refreshCurrentUser() {
    const response = await apiRequest("/users/me");
    if (response && response.user) {
        localStorage.setItem("currentUserProfile", JSON.stringify(response.user));
        return response.user;
    }
    return getCurrentUser();
}

function logout() {
    clearAuthSession();
    window.location.href = "login.html";
}

const STUDENT_ALLOWED_WHEN_UNALLOCATED = new Set(["My Profile", "Room Details", "Notices"]);

function isStudentAllocated(user) {
    return !!(user && user.role === "student" && user.room);
}

function renderRoomNotAllocatedNotice() {
    const mainWrapper = document.querySelector(".main-wrapper");
    if (!mainWrapper) return;

    const topNav = mainWrapper.querySelector(".top-nav");
    const children = Array.from(mainWrapper.children);
    children.forEach((child) => {
        if (child !== topNav) {
            child.remove();
        }
    });

    const notice = document.createElement("div");
    notice.className = "custom-table-card p-4 mt-4";
    notice.innerHTML = `
        <h5 class="fw-bold mb-2">Room Not Allocated</h5>
        <p class="text-muted mb-0">
            Your room has not been allocated yet. Only Personal Details and Room Details are available until allocation is completed.
        </p>
    `;
    mainWrapper.appendChild(notice);
}

async function initStudentPage(activePage) {
    let user = getCurrentUser();
    if (!user || user.role !== "student") {
        window.location.href = "login.html";
        return null;
    }

    try {
        user = await refreshCurrentUser();
    } catch (_e) {
        // Fall back to cached user if refresh fails.
    }

    renderSidebar(activePage, "student");
    renderTopNav(user.name || "Student");

    const isAllowed = isStudentAllocated(user) || STUDENT_ALLOWED_WHEN_UNALLOCATED.has(activePage);
    if (!isAllowed) {
        renderRoomNotAllocatedNotice();
        return { user, blocked: true };
    }

    return { user, blocked: false };
}

async function initWardenPage(activePage) {
    let user = getCurrentUser();
    if (!user || user.role !== "warden") {
        window.location.href = "login.html";
        return null;
    }
    try {
        user = await refreshCurrentUser();
    } catch (_e) {}
    renderSidebar(activePage, "warden");
    renderTopNav(user.name || "Warden");
    return { user };
}

// ── Navigation UI Helper ─────────────────────────

function renderSidebar(activePage, role) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const studentLinks = [
        { name: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'student-dashboard.html' },
        { name: 'My Profile', icon: 'bi-person-fill', href: 'student-profile.html' },
        { name: 'Room Details', icon: 'bi-door-closed-fill', href: 'student-room.html' },
        { name: 'Notices', icon: 'bi-info-circle-fill', href: 'student-notices.html' },
        { name: 'Fees Status', icon: 'bi-credit-card-fill', href: 'student-fees.html' },
        { name: 'Attendance', icon: 'bi-calendar-check-fill', href: 'student-attendance.html' },
        { name: 'Complaints', icon: 'bi-chat-left-text-fill', href: 'student-complaints.html' },
        { name: 'Leave Requests', icon: 'bi-calendar2-event', href: 'student-leaves.html' },
        { name: 'Hostel Menu', icon: 'bi-egg-fried', href: 'student-menu.html' }
    ];

    const adminLinks = [
        { name: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'admin-dashboard.html' },
        { name: 'Wardens', icon: 'bi-person-badge-fill', href: 'admin-wardens.html' },
        { name: 'Students', icon: 'bi-people-fill', href: 'admin-students.html' },
        { name: 'Rooms', icon: 'bi-door-open-fill', href: 'admin-rooms.html' },
        { name: 'Fees', icon: 'bi-cash-stack', href: 'admin-fees.html' },
        { name: 'Attendance', icon: 'bi-calendar-event', href: 'admin-attendance.html' },
        { name: 'Complaints', icon: 'bi-exclamation-triangle-fill', href: 'admin-complaints.html' },
        { name: 'Leave Requests', icon: 'bi-calendar2-check', href: 'admin-leaves.html' },
        { name: 'Menu', icon: 'bi-list-ul', href: 'admin-menu.html' },
        { name: 'Notices', icon: 'bi-info-circle-fill', href: 'admin-notices.html' }
    ];

    const wardenLinks = [
        { name: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'warden-dashboard.html' },
        { name: 'Students', icon: 'bi-people-fill', href: 'admin-students.html' },
        { name: 'Assigned Rooms', icon: 'bi-door-open-fill', href: 'warden-rooms.html' },
        { name: 'Attendance', icon: 'bi-calendar-event', href: 'admin-attendance.html' },
        { name: 'Leave Requests', icon: 'bi-calendar2-check', href: 'warden-leaves.html' },
        { name: 'Complaints', icon: 'bi-exclamation-triangle-fill', href: 'admin-complaints.html' },
        { name: 'Menu', icon: 'bi-list-ul', href: 'warden-menu.html' },
        { name: 'Notices', icon: 'bi-info-circle-fill', href: 'warden-notices.html' }
    ];

    const links = role === 'admin' ? adminLinks : (role === 'warden' ? wardenLinks : studentLinks);

    let html = `
        <a href="index.html" class="sidebar-brand">
            <i class="bi bi-building"></i>
            <span>HostelHub</span>
        </a>
        <nav class="nav flex-column">
    `;

    const currentUser = getCurrentUser();
    const lockStudentFeatures =
        role === "student" &&
        currentUser &&
        currentUser.role === "student" &&
        !isStudentAllocated(currentUser);

    links.forEach(link => {
        const isLocked = lockStudentFeatures && !STUDENT_ALLOWED_WHEN_UNALLOCATED.has(link.name);
        const activeClass = activePage === link.name ? 'active' : '';
        const linkClass = isLocked ? "disabled text-muted" : activeClass;
        const href = isLocked ? "#" : link.href;
        const clickHandler = isLocked
            ? "onclick=\"alert('Room not allocated yet. This feature is available after room allocation.'); return false;\""
            : "";
        html += `
            <a class="nav-link ${linkClass}" href="${href}" ${clickHandler}>
                <i class="bi ${link.icon}"></i>
                <span>${link.name}</span>
            </a>
        `;
    });

    html += `
            <a class="nav-link mt-auto text-danger" href="#" onclick="logout()">
                <i class="bi bi-box-arrow-right"></i>
                <span>Logout</span>
            </a>
        </nav>
    `;

    sidebar.innerHTML = html;
}

function renderTopNav(userName) {
    const mainWrapper = document.querySelector('.main-wrapper');
    if (!mainWrapper) return;

    const navHtml = `
        <header class="top-nav fade-in">
            <div class="d-flex align-items-center gap-3">
                <button class="btn d-lg-none p-0 border-0" onclick="document.querySelector('.sidebar').classList.toggle('show')">
                    <i class="bi bi-list fs-2"></i>
                </button>
                <h4 class="fw-bold mb-0">Welcome Back, ${userName}!</h4>
            </div>
            <div class="user-profile">
                <div class="user-avatar">${userName.charAt(0)}</div>
                <div class="d-none d-md-block">
                    <div class="fw-bold small">${userName}</div>
                    <div class="text-muted" style="font-size: 0.7rem;">Active Now</div>
                </div>
            </div>
        </header>
    `;

    mainWrapper.insertAdjacentHTML('afterbegin', navHtml);
}

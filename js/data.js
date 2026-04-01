const API_BASE_URL = window.HOSTELHUB_API_URL || `${window.location.origin}/api`;

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

// ── Navigation UI Helper ─────────────────────────

function renderSidebar(activePage, role) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const studentLinks = [
        { name: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'student-dashboard.html' },
        { name: 'My Profile', icon: 'bi-person-fill', href: 'student-profile.html' },
        { name: 'Room Details', icon: 'bi-door-closed-fill', href: 'student-room.html' },
        { name: 'Fees Status', icon: 'bi-credit-card-fill', href: 'student-fees.html' },
        { name: 'Attendance', icon: 'bi-calendar-check-fill', href: 'student-attendance.html' },
        { name: 'Complaints', icon: 'bi-chat-left-text-fill', href: 'student-complaints.html' },
        { name: 'Leave Requests', icon: 'bi-calendar2-event', href: 'student-leaves.html' },
        { name: 'Hostel Menu', icon: 'bi-egg-fried', href: 'student-menu.html' },
        { name: 'Notice Board', icon: 'bi-megaphone-fill', href: 'student-notices.html' }
    ];

    const adminLinks = [
        { name: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'admin-dashboard.html' },
        { name: 'Students', icon: 'bi-people-fill', href: 'admin-students.html' },
        { name: 'Rooms', icon: 'bi-door-open-fill', href: 'admin-rooms.html' },
        { name: 'Fees', icon: 'bi-cash-stack', href: 'admin-fees.html' },
        { name: 'Attendance', icon: 'bi-calendar-event', href: 'admin-attendance.html' },
        { name: 'Complaints', icon: 'bi-exclamation-triangle-fill', href: 'admin-complaints.html' },
        { name: 'Leave Requests', icon: 'bi-calendar2-check', href: 'admin-leaves.html' },
        { name: 'Menu', icon: 'bi-list-ul', href: 'admin-menu.html' },
        { name: 'Notices', icon: 'bi-info-circle-fill', href: 'admin-notices.html' }
    ];

    const links = role === 'admin' ? adminLinks : studentLinks;

    let html = `
        <a href="index.html" class="sidebar-brand">
            <i class="bi bi-building"></i>
            <span>HostelHub</span>
        </a>
        <nav class="nav flex-column">
    `;

    links.forEach(link => {
        const activeClass = activePage === link.name ? 'active' : '';
        html += `
            <a class="nav-link ${activeClass}" href="${link.href}">
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

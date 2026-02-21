// app.js - FleetFlow Front-End Logic (Multi-Page Architecture)

// ============================================================================
// Role-Based Access Control (RBAC)
// ============================================================================

/**
 * ROLE_CONFIG defines what each role is responsible for and
 * which pages they are allowed to access.
 *
 * Fleet Manager    → vehicles, maintenance, scheduling
 * Dispatcher       → trips, assign drivers, cargo
 * Safety Officer   → driver compliance, license expirations, safety scores
 * Financial Analyst→ fuel spend, maintenance ROI, operational costs
 * Admin            → everything
 */
const ROLE_CONFIG = {
    admin: {
        label: 'Administrator',
        responsibility: 'Full system access — all modules',
        home: '/dashboard',
        pages: ['dashboard', 'vehicles', 'dispatch', 'maintenance', 'expenses', 'drivers', 'analytics', 'users'],
    },
    manager: {
        label: 'Fleet Manager',
        responsibility: 'Vehicle health, asset lifecycle & scheduling',
        home: '/vehicles',
        pages: ['dashboard', 'vehicles', 'dispatch', 'maintenance', 'drivers', 'analytics'],
    },
    dispatcher: {
        label: 'Dispatcher',
        responsibility: 'Create trips, assign drivers & validate cargo loads',
        home: '/dispatch',
        pages: ['dashboard', 'vehicles', 'dispatch', 'drivers'],
    },
    safety: {
        label: 'Safety Officer',
        responsibility: 'Driver compliance, license expirations & safety scores',
        home: '/drivers',
        pages: ['dashboard', 'drivers', 'maintenance'],
    },
    finance: {
        label: 'Financial Analyst',
        responsibility: 'Fuel spend, maintenance ROI & operational costs',
        home: '/expenses',
        pages: ['dashboard', 'expenses', 'analytics'],
    },
};

/**
 * Hide sidebar nav items the current user's role cannot access,
 * and inject a role badge under the sidebar brand.
 */
function applyRoleBasedAccess(user) {
    if (!user || !user.role) return;
    const config = ROLE_CONFIG[user.role] || ROLE_CONFIG['dispatcher'];

    // --- Filter nav links ---
    document.querySelectorAll('.nav-item[data-roles]').forEach(item => {
        const allowed = item.getAttribute('data-roles').split(',').map(r => r.trim());
        if (!allowed.includes(user.role)) {
            item.style.display = 'none';
        }
    });

    // --- Also hide section labels that have no visible items ---
    document.querySelectorAll('.nav-label').forEach(label => {
        // Find the next items until the next label
        let sibling = label.nextElementSibling;
        let hasVisible = false;
        while (sibling && !sibling.classList.contains('nav-label')) {
            if (sibling.style.display !== 'none') hasVisible = true;
            sibling = sibling.nextElementSibling;
        }
        if (!hasVisible) label.style.display = 'none';
    });

    // --- Inject role badge below sidebar brand ---
    const header = document.querySelector('.sidebar-header');
    if (header && !document.getElementById('role-badge-box')) {
        const box = document.createElement('div');
        box.id = 'role-badge-box';
        box.innerHTML = `
            <div style="
                margin: 0 1rem 0.5rem;
                padding: 0.6rem 0.9rem;
                border-radius: 10px;
                background: rgba(37,99,235,0.08);
                border: 1px solid rgba(37,99,235,0.15);
                font-size: 0.78rem;
                line-height: 1.45;
            ">
                <div style="font-weight:700; color:var(--primary, #2563EB); letter-spacing:0.02em;">${config.label}</div>
                <div style="color:var(--text-muted); margin-top:2px;">${config.responsibility}</div>
            </div>`;
        header.insertAdjacentElement('afterend', box);
    }

    // --- Update sidebar user role display name ---
    const roleEl = document.getElementById('sidebar-user-role');
    if (roleEl) roleEl.textContent = config.label;
}

/**
 * If the current page URL is not in the user's allowed pages,
 * redirect them to their home page.
 */
function guardCurrentPage(user) {
    if (!user || !user.role) return;
    const config = ROLE_CONFIG[user.role];
    if (!config) return;

    // Map URL path → page id
    const pathToPage = {
        '/dashboard': 'dashboard',
        '/vehicles': 'vehicles',
        '/dispatch': 'dispatch',
        '/maintenance': 'maintenance',
        '/expenses': 'expenses',
        '/drivers': 'drivers',
        '/analytics': 'analytics',
        '/users': 'users',
    };
    const currentPage = pathToPage[window.location.pathname];
    if (currentPage && !config.pages.includes(currentPage)) {
        // Redirect to the role's home page
        window.location.href = config.home;
    }
}

// Mark the correct sidebar link as active based on current page
function setActiveNavLink(pageId) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (link) link.classList.add('active');
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (window.innerWidth <= 992) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

// ============================================================================
// Dropdown Management
// ============================================================================

function toggleDropdown(id, event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById(id);
    const isOpen = panel && panel.classList.contains('open');
    closeAllDropdowns();
    if (panel && !isOpen) panel.classList.add('open');
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('open'));
}

document.addEventListener('click', closeAllDropdowns);

// ============================================================================
// Dark Mode
// ============================================================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function clearNotifications() {
    const list = document.getElementById('notif-list');
    if (list) {
        list.innerHTML = '<li style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.85rem;"><i class="fa-regular fa-bell-slash"></i> No notifications</li>';
    }
}

// ============================================================================
// Authentication
// ============================================================================

async function loginFromDB(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    const errEl = document.getElementById('login-error');

    if (!emailInput || !passInput) return;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
    btn.disabled = true;
    errEl.style.display = 'none';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput.value, password: passInput.value })
        });
        const data = await res.json();
        if (data.success) {
            // Store user in sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            // Redirect to role's designated home page
            const config = ROLE_CONFIG[data.user.role] || ROLE_CONFIG['dispatcher'];
            window.location.href = config.home;
        } else {
            errEl.textContent = data.error || 'Login failed.';
            errEl.style.display = 'block';
        }
    } catch (err) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
    } finally {
        btn.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled = false;
    }
}

async function signupUser(event) {
    event.preventDefault();
    const errEl = document.getElementById('signup-error');
    const okEl = document.getElementById('signup-success');
    errEl.style.display = 'none';
    okEl.style.display = 'none';

    const payload = {
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
        role: document.getElementById('signup-role').value,
    };

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            okEl.textContent = 'Account created! You can now sign in.';
            okEl.style.display = 'block';
            event.target.reset();
        } else {
            errEl.textContent = data.detail || data.error || 'Registration failed.';
            errEl.style.display = 'block';
        }
    } catch {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
    }
}

function openSignupModal() { document.getElementById('signup-modal').style.display = 'flex'; }
function closeSignupModal() { document.getElementById('signup-modal').style.display = 'none'; }

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/';
}

// ============================================================================
// Sidebar User Info (from sessionStorage)
// ============================================================================

function applyCurrentUser() {
    const stored = sessionStorage.getItem('currentUser');
    if (!stored) return;
    const user = JSON.parse(stored);
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = user.name || 'User';
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;
    // Apply role-based access control (filters sidebar + injects role badge)
    applyRoleBasedAccess(user);
    // Guard: redirect away if current page is off-limits
    guardCurrentPage(user);
}

// ============================================================================
// Chart Generators (dashboard & analytics)
// ============================================================================

let utilizationChartInst, revenueChartInst, fuelChartInst, roiChartInst;

const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Chart global defaults (applied once Chart.js is loaded)
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748B';
}

function initDashboardCharts() {
    const utilCtx = document.getElementById('utilizationChart');
    const revCtx = document.getElementById('revenueChart');
    if (!utilCtx || !revCtx) return;

    if (utilizationChartInst) utilizationChartInst.destroy();
    if (revenueChartInst) revenueChartInst.destroy();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    utilizationChartInst = new Chart(utilCtx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Fleet Utilization (%)',
                data: typeof utilizationData !== 'undefined' ? utilizationData : [80, 82, 85, 88, 86, 84, 87],
                borderColor: getCssVar('--brand-blue') || '#2563EB',
                backgroundColor: 'rgba(37,99,235,0.1)',
                borderWidth: 2, tension: 0.4, fill: true,
                pointBackgroundColor: getCssVar('--brand-blue') || '#2563EB',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, min: 70, max: 100, border: { display: false }, grid: { color: getCssVar('--border-light') } },
                x: { border: { display: false }, grid: { display: false } }
            }
        }
    });

    revenueChartInst = new Chart(revCtx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Revenue ($k)',
                    data: typeof revenueData !== 'undefined' ? revenueData : [120, 132, 145, 128, 150, 110, 105],
                    backgroundColor: getCssVar('--success') || '#10B981', borderRadius: 4
                },
                {
                    label: 'Op Costs ($k)',
                    data: typeof costData !== 'undefined' ? costData : [85, 90, 88, 92, 95, 80, 82],
                    backgroundColor: getCssVar('--warning') || '#F59E0B', borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
            scales: {
                y: { beginAtZero: true, border: { display: false }, grid: { color: getCssVar('--border-light') } },
                x: { border: { display: false }, grid: { display: false } }
            }
        }
    });
}

function initAnalyticsCharts() {
    const fuelCtx = document.getElementById('fuelEfficiencyChart');
    const roiCtx = document.getElementById('roiChart');
    if (!fuelCtx || !roiCtx) return;

    if (fuelChartInst) fuelChartInst.destroy();
    if (roiChartInst) roiChartInst.destroy();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    fuelChartInst = new Chart(fuelCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Avg MPG',
                data: typeof fuelData !== 'undefined' ? fuelData : [6.8, 6.9, 7.1, 7.0, 7.2, 7.4],
                borderColor: getCssVar('--success') || '#10B981',
                borderWidth: 2, tension: 0.3,
                pointBackgroundColor: getCssVar('--success') || '#10B981'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    roiChartInst = new Chart(roiCtx, {
        type: 'doughnut',
        data: {
            labels: ['Heavy Duty', 'Light Transit', 'Vans', 'Specials'],
            datasets: [{
                data: typeof roiData !== 'undefined' ? roiData : [45, 25, 20, 10],
                backgroundColor: [
                    getCssVar('--brand-blue') || '#2563EB',
                    getCssVar('--success') || '#10B981',
                    getCssVar('--warning') || '#F59E0B',
                    getCssVar('--primary-light') || '#93C5FD',
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'right' } }
        }
    });
}

// ============================================================================
// Vehicle Registry Functions
// ============================================================================

function loadVehicles() {
    fetch('/api/vehicles')
        .then(r => r.json())
        .then(vehicles => {
            allVehicles = vehicles;
            renderVehiclesTable(vehicles);
        })
        .catch(() => {
            const tbody = document.getElementById('vehicles-table-body');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Could not load vehicles.</td></tr>';
        });
}

function openRegisterVehicleModal() { document.getElementById('register-vehicle-modal').style.display = 'flex'; }
function closeRegisterVehicleModal() { document.getElementById('register-vehicle-modal').style.display = 'none'; }

async function registerVehicle(event) {
    event.preventDefault();
    const errEl = document.getElementById('reg-vehicle-error');
    if (errEl) errEl.style.display = 'none';

    const payload = {
        vehicle_id: document.getElementById('reg-vehicle-id').value,
        make: document.getElementById('reg-make').value,
        model: document.getElementById('reg-model').value,
        year: parseInt(document.getElementById('reg-year').value),
        vehicle_type: document.getElementById('reg-type').value,
        vehicle_class: document.getElementById('reg-class').value,
        mileage: parseInt(document.getElementById('reg-mileage').value),
        vin: document.getElementById('reg-vin').value,
        license_plate: document.getElementById('reg-plate').value,
    };

    const res = await fetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (data.success) {
        closeRegisterVehicleModal();
        loadVehicles();
        event.target.reset();
    } else {
        if (errEl) { errEl.textContent = data.detail || data.error || 'Failed to register vehicle.'; errEl.style.display = 'block'; }
    }
}

async function deleteVehicleRow(dbId, vehicleId) {
    if (!confirm(`Delete vehicle ${vehicleId}? This action cannot be undone.`)) return;
    const res = await fetch(`/api/vehicles/${dbId}`, { method: 'DELETE' });
    if (res.ok) loadVehicles();
}

// ============================================================================
// User Management Functions
// ============================================================================

function openAddUserModal() { document.getElementById('add-user-modal').style.display = 'flex'; }
function closeAddUserModal() { document.getElementById('add-user-modal').style.display = 'none'; }

function loadUsers() {
    fetch('/api/users')
        .then(r => r.json())
        .then(users => {
            renderUsersTable(users);
            updateUserStats(users);
        });
}

function updateUserStats(users) {
    const total = users.length;
    const managers = users.filter(u => u.role === 'manager').length;
    const dispatchers = users.filter(u => u.role === 'dispatcher').length;
    const active = users.filter(u => u.status === 'active').length;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('stat-total', total);
    setEl('stat-managers', managers);
    setEl('stat-dispatchers', dispatchers);
    setEl('stat-active', active);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No users found.</td></tr>';
        return;
    }
    const roles = ['admin', 'manager', 'dispatcher', 'safety', 'finance'];
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="${u.avatar || 'https://i.pravatar.cc/150?img=1'}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                    <div>
                        <div class="font-semibold">${u.name}</div>
                    </div>
                </div>
            </td>
            <td style="color:var(--text-muted); font-size:0.85rem;">${u.email}</td>
            <td><span class="badge badge-info">${u.role}</span></td>
            <td>
                <select class="form-control" style="padding:0.3rem 0.5rem; font-size:0.82rem;" onchange="updateRole(${u.id}, this.value)">
                    ${roles.map(r => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}
                </select>
            </td>
            <td>
                <span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-neutral'}">${u.status}</span>
            </td>
            <td class="text-right">
                <button class="btn btn-outline" style="padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="deleteUser(${u.id}, '${u.name}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateRole(userId, newRole) {
    const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
    });
    if (!res.ok) alert('Failed to update role. Please try again.');
}

async function addUser(event) {
    event.preventDefault();
    const errEl = document.getElementById('add-user-error');
    if (errEl) errEl.style.display = 'none';

    const payload = {
        name: document.getElementById('new-user-name').value,
        email: document.getElementById('new-user-email').value,
        role: document.getElementById('new-user-role').value,
        password: '',
    };
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (data.success) {
        closeAddUserModal();
        event.target.reset();
        loadUsers();
    } else {
        if (errEl) { errEl.textContent = data.detail || data.error || 'Failed to create user.'; errEl.style.display = 'block'; }
    }
}

async function deleteUser(userId, name) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) loadUsers();
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Apply dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) toggle.checked = true;
    }
    // Apply session user info to sidebar
    applyCurrentUser();
});

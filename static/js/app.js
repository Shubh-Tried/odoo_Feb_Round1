/* =========================================================
   FleetFlow - Application JavaScript
   ========================================================= */

/* ----- Role Configuration ----- */
var currentRole = '';

var roleProfiles = {
    manager: { name: 'Jane Doe', title: 'Operations Manager', avatar: 'https://i.pravatar.cc/150?img=11' },
    dispatcher: { name: 'Jim Halpert', title: 'Fleet Dispatcher', avatar: 'https://i.pravatar.cc/150?img=33' },
    safety: { name: 'Dwight Schrute', title: 'Safety Officer', avatar: 'https://i.pravatar.cc/150?img=12' },
    finance: { name: 'Oscar Martinez', title: 'Financial Analyst', avatar: 'https://i.pravatar.cc/150?img=14' }
};

/* Section labels map: which roles see each section label */
var sectionRoles = {
    main: ['manager', 'dispatcher', 'safety', 'finance'],
    operations: ['manager', 'safety', 'finance'],
    insights: ['manager', 'finance'],
    admin: ['manager']
};

/* ----- Login / Logout ----- */
function login(e) {
    if (e) e.preventDefault();

    // 1. Get selected role
    var roleSelect = document.getElementById('role-select');
    currentRole = roleSelect ? roleSelect.value : 'manager';

    // 2. Filter sidebar nav items by role
    document.querySelectorAll('.nav-item[data-roles]').forEach(function (item) {
        var allowed = item.getAttribute('data-roles').split(',');
        if (allowed.indexOf(currentRole) !== -1) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });

    // 3. Filter section labels — hide if no visible children under them
    document.querySelectorAll('.nav-label[data-section]').forEach(function (label) {
        var section = label.getAttribute('data-section');
        var roles = sectionRoles[section] || [];
        if (roles.indexOf(currentRole) !== -1) {
            label.style.display = '';
        } else {
            label.style.display = 'none';
        }
    });

    // 4. Show/hide page sections based on role
    document.querySelectorAll('.page-section').forEach(function (sec) {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    document.querySelectorAll('.nav-item[data-roles]').forEach(function (item) {
        var allowed = item.getAttribute('data-roles').split(',');
        var link = item.querySelector('.nav-link');
        if (link) {
            var page = link.getAttribute('data-page');
            var section = document.getElementById('content-' + page);
            if (section) {
                section.style.display = (allowed.indexOf(currentRole) !== -1) ? '' : 'none';
            }
        }
    });

    // 5. Update sidebar user info
    var profile = roleProfiles[currentRole] || roleProfiles.manager;
    var nameEl = document.getElementById('sidebar-user-name');
    var roleEl = document.getElementById('sidebar-user-role');
    var avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = profile.name;
    if (roleEl) roleEl.textContent = profile.title;
    if (avatarEl) avatarEl.src = profile.avatar;

    // 6. Switch views
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-main').classList.add('active');

    // 7. Default to dashboard
    navigateTo('dashboard');
    initCharts();
}

function logout() {
    currentRole = '';
    document.getElementById('view-main').classList.remove('active');
    document.getElementById('view-login').classList.add('active');

    // Reset all nav items and sections to visible for next login
    document.querySelectorAll('.nav-item[data-roles]').forEach(function (item) {
        item.style.display = '';
    });
    document.querySelectorAll('.nav-label[data-section]').forEach(function (label) {
        label.style.display = '';
    });
    document.querySelectorAll('.page-section').forEach(function (sec) {
        sec.style.display = '';
        sec.classList.remove('active');
    });
}

/* ----- Sidebar Navigation ----- */
function navigateTo(page) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.classList.remove('active');
    });
    var activeLink = document.querySelector('.nav-link[data-page="' + page + '"]');
    if (activeLink) activeLink.classList.add('active');

    // Update page sections
    document.querySelectorAll('.page-section').forEach(function (section) {
        section.classList.remove('active');
    });
    var activeSection = document.getElementById('content-' + page);
    if (activeSection) activeSection.classList.add('active');

    // Re-init charts if switching to dashboard or analytics (canvas may need redraw)
    if (page === 'dashboard' || page === 'analytics') {
        setTimeout(initCharts, 100);
    }

    // Auto-load users when navigating to User Management
    if (page === 'users') {
        loadUsers();
    }
}

/* ----- Sidebar Toggle ----- */
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

/* ----- Chart Initialization ----- */
var chartsInitialized = { utilization: false, revenue: false, fuel: false, roi: false };

function initCharts() {

    // 1. Utilization Chart (Dashboard)
    var utilCtx = document.getElementById('utilizationChart');
    if (utilCtx && typeof utilizationData !== 'undefined' && !chartsInitialized.utilization) {
        chartsInitialized.utilization = true;
        new Chart(utilCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Utilization %',
                    data: utilizationData,
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563EB'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, min: 75, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Revenue vs Cost Chart (Dashboard)
    var revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && typeof revenueData !== 'undefined' && !chartsInitialized.revenue) {
        chartsInitialized.revenue = true;
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Revenue ($k)',
                        data: revenueData,
                        backgroundColor: '#2563EB',
                        borderRadius: 6
                    },
                    {
                        label: 'Costs ($k)',
                        data: costData,
                        backgroundColor: '#E2E8F0',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Fuel Efficiency Chart (Analytics)
    var fuelCtx = document.getElementById('fuelEfficiencyChart');
    if (fuelCtx && typeof fuelData !== 'undefined' && !chartsInitialized.fuel) {
        chartsInitialized.fuel = true;
        new Chart(fuelCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Avg MPG',
                    data: fuelData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 4. ROI Doughnut Chart (Analytics)
    var roiCtx = document.getElementById('roiChart');
    if (roiCtx && typeof roiData !== 'undefined' && !chartsInitialized.roi) {
        chartsInitialized.roi = true;
        new Chart(roiCtx, {
            type: 'doughnut',
            data: {
                labels: ['Heavy Duty', 'Transit', 'Vans', 'Special'],
                datasets: [{
                    data: roiData,
                    backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
                }
            }
        });
    }
}

/* ----- Dropdown Panels (Notifications & Settings) ----- */
function toggleDropdown(id, event) {
    if (event) event.stopPropagation();

    var panel = document.getElementById(id);
    var isOpen = panel.classList.contains('open');

    // Close ALL dropdowns first
    document.querySelectorAll('.dropdown-panel').forEach(function (p) {
        p.classList.remove('open');
    });

    // Only open this one if it was previously closed
    if (!isOpen) {
        panel.classList.add('open');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-panel').forEach(function (p) {
        p.classList.remove('open');
    });
}

// Close dropdowns when clicking anywhere outside
document.addEventListener('click', function (e) {
    // If click is outside any dropdown-wrapper, close all
    if (!e.target.closest('.dropdown-wrapper')) {
        closeAllDropdowns();
    }
});

/* ----- Notifications ----- */
function clearNotifications() {
    document.querySelectorAll('#notif-list .dropdown-item.unread').forEach(function (item) {
        item.classList.remove('unread');
    });
    // Hide the red badge indicator
    var badge = document.querySelector('.badge-indicator');
    if (badge) badge.style.display = 'none';
}

/* ----- Dark Mode Toggle ----- */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    var toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = document.body.classList.contains('dark-mode');
    localStorage.setItem('fleetflow-dark', document.body.classList.contains('dark-mode'));
}

// Restore dark mode preference on load
document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('fleetflow-dark') === 'true') {
        document.body.classList.add('dark-mode');
        var toggle = document.getElementById('dark-mode-toggle');
        if (toggle) toggle.checked = true;
    }
});

/* ==========================================================================
   USER MANAGEMENT (Manager Only)
   ========================================================================== */
var roleLabels = {
    manager: 'Manager',
    dispatcher: 'Dispatcher',
    safety: 'Safety Officer',
    finance: 'Financial Analyst'
};

var roleBadgeClass = {
    manager: 'badge-success',
    dispatcher: 'badge-warning',
    safety: 'badge-info',
    finance: 'badge-neutral'
};

function loadUsers() {
    fetch('/api/users')
        .then(function (res) { return res.json(); })
        .then(function (users) {
            renderUsersTable(users);
            updateUserStats(users);
        })
        .catch(function (err) {
            console.error('Failed to load users:', err);
        });
}

function renderUsersTable(users) {
    var tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = users.map(function (u) {
        var badge = roleBadgeClass[u.role] || 'badge-neutral';
        var label = roleLabels[u.role] || u.role;
        var statusBadge = u.status === 'active'
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Inactive</span>';

        return '<tr>' +
            '<td>' +
            '<div style="display:flex;align-items:center;gap:0.75rem;">' +
            '<img src="' + u.avatar + '" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">' +
            '<strong>' + u.name + '</strong>' +
            '</div>' +
            '</td>' +
            '<td>' + u.email + '</td>' +
            '<td><span class="badge ' + badge + '">' + label + '</span></td>' +
            '<td>' +
            '<select class="form-control" style="width:160px;padding:0.35rem 0.5rem;font-size:0.8rem;" onchange="changeUserRole(' + u.id + ', this.value)">' +
            '<option value="manager"' + (u.role === 'manager' ? ' selected' : '') + '>Manager</option>' +
            '<option value="dispatcher"' + (u.role === 'dispatcher' ? ' selected' : '') + '>Dispatcher</option>' +
            '<option value="safety"' + (u.role === 'safety' ? ' selected' : '') + '>Safety Officer</option>' +
            '<option value="finance"' + (u.role === 'finance' ? ' selected' : '') + '>Financial Analyst</option>' +
            '</select>' +
            '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td class="text-right">' +
            '<button class="table-action-dots text-danger" onclick="deleteUser(' + u.id + ')" title="Remove User"><i class="fa-solid fa-trash"></i></button>' +
            '</td>' +
            '</tr>';
    }).join('');
}

function updateUserStats(users) {
    var el = function (id) { return document.getElementById(id); };
    if (el('stat-total')) el('stat-total').textContent = users.length;
    if (el('stat-managers')) el('stat-managers').textContent = users.filter(function (u) { return u.role === 'manager'; }).length;
    if (el('stat-dispatchers')) el('stat-dispatchers').textContent = users.filter(function (u) { return u.role === 'dispatcher'; }).length;
    if (el('stat-active')) el('stat-active').textContent = users.filter(function (u) { return u.status === 'active'; }).length;
}

function changeUserRole(userId, newRole) {
    fetch('/api/users/' + userId + '/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
    })
        .then(function (res) { return res.json(); })
        .then(function () { loadUsers(); })
        .catch(function (err) { console.error('Role update failed:', err); });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to remove this user?')) return;
    fetch('/api/users/' + userId, { method: 'DELETE' })
        .then(function () { loadUsers(); })
        .catch(function (err) { console.error('Delete failed:', err); });
}

function openAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'flex';
}

function closeAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'none';
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-email').value = '';
}

function addUser(e) {
    e.preventDefault();
    var name = document.getElementById('new-user-name').value;
    var email = document.getElementById('new-user-email').value;
    var role = document.getElementById('new-user-role').value;

    fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, role: role })
    })
        .then(function (res) { return res.json(); })
        .then(function () {
            closeAddUserModal();
            loadUsers();
        })
        .catch(function (err) { console.error('Create user failed:', err); });
}
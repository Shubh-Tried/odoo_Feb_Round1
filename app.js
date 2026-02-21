// app.js - FleetFlow Front-End Logic

// ============================================================================
// State & Navigation Management
// ============================================================================

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 992) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

// Navigation
function navigateTo(pageId) {
    // Hide all page sections
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show target section
    const targetEl = document.getElementById(`content-${pageId}`);
    if (targetEl) {
        targetEl.classList.add('active');
    }
    
    // Update sidebar active states
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Close mobile sidebar if open
    if (window.innerWidth <= 992) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }

    // Initialize charts if navigating to specific pages
    if (pageId === 'dashboard') {
        initDashboardCharts();
    } else if (pageId === 'analytics') {
        initAnalyticsCharts();
    }
}

// Authentication (Mock)
function login() {
    const btn = document.querySelector('.login-form button[type="submit"]');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
    btn.disabled = true;
    
    // Simulate network delay
    setTimeout(() => {
        document.getElementById('view-login').classList.remove('active');
        document.getElementById('view-main').classList.add('active');
        
        // Reset button
        btn.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled = false;
        
        // Navigate to default page
        navigateTo('dashboard');
    }, 1000);
}

function logout() {
    document.getElementById('view-main').classList.remove('active');
    document.getElementById('view-login').classList.add('active');
}

// ============================================================================
// Chart Generators
// ============================================================================

// Global chart instances to destroy them before re-creating
let utilizationChart, revenueChart, fuelChart, roiChart;

// CSS Variable helper
const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Chart defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748B';

function initDashboardCharts() {
    // Only init if canvas exists
    const utilCtx = document.getElementById('utilizationChart');
    const revCtx = document.getElementById('revenueChart');
    
    if (!utilCtx || !revCtx) return;

    if (utilizationChart) utilizationChart.destroy();
    if (revenueChart) revenueChart.destroy();

    // Mock Data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Utilization Chart (Line)
    utilizationChart = new Chart(utilCtx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Fleet Utilization (%)',
                data: [82, 85, 89, 88, 92, 86, 88.6],
                borderColor: getCssVar('--brand-blue'),
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: getCssVar('--brand-blue'),
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, min: 70, max: 100, border: { display: false }, grid: { color: getCssVar('--border-light') } },
                x: { border: { display: false }, grid: { display: false } }
            }
        }
    });

    // Revenue/Cost Chart (Bar)
    revenueChart = new Chart(revCtx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Revenue ($k)',
                    data: [120, 132, 145, 128, 150, 110, 105],
                    backgroundColor: getCssVar('--success'),
                    borderRadius: 4
                },
                {
                    label: 'Op Costs ($k)',
                    data: [85, 90, 88, 92, 95, 80, 82],
                    backgroundColor: getCssVar('--warning'),
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
            },
            scales: {
                y: { beginAtZero: true, border: { display: false }, grid: { color: getCssVar('--border-light') } },
                x: { border: { display: false }, grid: { display: false } }
            }
        }
    });
}

function initAnalyticsCharts() {
    // Only init if canvas exists
    const fuelCtx = document.getElementById('fuelEfficiencyChart');
    const roiCtx = document.getElementById('roiChart');
    
    if (!fuelCtx || !roiCtx) return;

    if (fuelChart) fuelChart.destroy();
    if (roiChart) roiChart.destroy();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    fuelChart = new Chart(fuelCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Avg MPG',
                data: [6.8, 6.9, 7.1, 7.0, 7.2, 7.4],
                borderColor: getCssVar('--success'),
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: getCssVar('--success')
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    roiChart = new Chart(roiCtx, {
        type: 'doughnut',
        data: {
            labels: ['Heavy Duty', 'Light Transit', 'Vans', 'Specials'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: [
                    getCssVar('--brand-blue'),
                    getCssVar('--success'),
                    getCssVar('--warning'),
                    getCssVar('--primary-light')
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'right' } }
        }
    });
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Form submissions prevention
    document.querySelectorAll('form').forEach(form => {
        if (!form.hasAttribute('onsubmit')) {
            form.addEventListener('submit', (e) => e.preventDefault());
        }
    });

    // Handle initial routing if needed (defaults to login showing)
});

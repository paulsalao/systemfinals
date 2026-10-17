// Admin control panel
(function () {
  const ADMIN_PASSWORD = 'admin123';
  const DEFAULT_SLOTS = {
    'Unit 101': [{ start: '09:00', end: '11:00' }, { start: '14:00', end: '16:00' }],
    'Unit 102': [{ start: '10:30', end: '12:30' }],
    'Unit 103': [{ start: '13:00', end: '15:00' }],
    'Unit 104': [{ start: '11:00', end: '13:00' }],
    'Deluxe Unit 201': [{ start: '12:00', end: '14:00' }],
    'Deluxe Unit 202': [{ start: '15:00', end: '17:00' }]
  };
  const UNITS = ['Unit 101', 'Unit 102', 'Unit 103', 'Unit 104', 'Deluxe Unit 201', 'Deluxe Unit 202'];

  function getSlots() {
    const stored = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
    return { ...DEFAULT_SLOTS, ...stored };
  }
  function saveSlots(slots) { localStorage.setItem('bookedSlots', JSON.stringify(slots)); }
  function convertMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return hour12 + ':' + String(m).padStart(2, '0') + ' ' + suffix;
  }

  function renderAdminPanel() {
    const container = document.getElementById('adminContainer');
    if (!container) return;
    const slots = getSlots();
    let html = '';
    UNITS.forEach(unit => {
      const unitSlots = slots[unit] || [];
      const hasBookings = unitSlots.length > 0;
      html += '<div class="admin-unit">';
      html += '<h3>' + unit + '</h3>';
      html += '<span class="status ' + (hasBookings ? 'booked' : 'available') + '">' + (hasBookings ? 'BOOKED' : 'AVAILABLE') + '</span>';
      if (hasBookings) {
        html += '<ul class="booking-list">';
        unitSlots.forEach((slot, index) => {
          const customerInfo = slot.customer ? ' - ' + slot.customer + ' (' + (slot.category || 'Regular') + ')' : '';
          html += '<li class="booking-item"><span>' + formatTime(slot.start) + ' - ' + formatTime(slot.end) + customerInfo + '</span></li>';
        });
        html += '</ul>';
      } else {
        html += '<p class="empty">No bookings. Unit is fully available.</p>';
        html += '<div class="add-booking"><input type="time" class="add-start" placeholder="Start"><input type="time" class="add-end" placeholder="End"><button class="add-btn" data-unit="' + unit + '">Add Booking</button></div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;

    document.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const row = this.closest('.add-booking');
        addBooking(this.dataset.unit, row.querySelector('.add-start').value, row.querySelector('.add-end').value);
      });
    });
  }

  function addBooking(unit, start, end) {
    if (!start || !end) { alert('Please enter both start and end times.'); return; }
    const slots = getSlots();
    if (!slots[unit]) slots[unit] = [];
    slots[unit].push({ start, end });
    saveSlots(slots);
    renderAdminPanel();
  }
  function resetUnit(unit) {
    const stored = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
    stored[unit] = [];
    saveSlots(stored);
    renderAdminPanel();
  }
  function resetSelectedUnit(unit) {
    if (!unit) return;
    resetUnit(unit);
  }

  function renderRecords() {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    const stored = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
    let rows = '';
    UNITS.forEach(unit => {
      const unitSlots = stored[unit] || [];
      unitSlots.forEach(slot => {
        if (slot.customer) {
          const date = slot.bookingDate || '';
          rows += '<tr>';
          rows += '<td>' + date + '</td>';
          rows += '<td>' + unit + '</td>';
          rows += '<td>' + slot.customer + '</td>';
          rows += '<td>' + (slot.category || 'Regular') + '</td>';
          rows += '<td>' + formatTime(slot.start) + ' - ' + formatTime(slot.end) + '</td>';
          rows += '<td>' + (slot.durationMinutes || '') + ' min</td>';
          rows += '<td>₱' + (slot.price || '') + '</td>';
          rows += '</tr>';
        }
      });
    });
    if (!rows) {
      rows = '<tr><td colspan="7" style="text-align:center;color:#64748b;">No customer booking records found.</td></tr>';
    }
    tbody.innerHTML = rows;
  }

  function askResetPassword(message, callback) {
    const pwd = prompt(message + ' - Enter admin password:');
    if (pwd === ADMIN_PASSWORD) { callback(); }
    else if (pwd !== null) { alert('Incorrect password. Access denied.'); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const resetBtn = document.getElementById('resetAllBtn');
    const unitSelectOverlay = document.getElementById('unitSelectOverlay');
    const unitSelectReset = document.getElementById('unitSelectReset');
    const unitSelectError = document.getElementById('unitSelectError');
    const unitSelectConfirm = document.getElementById('unitSelectConfirm');
    const unitSelectCancel = document.getElementById('unitSelectCancel');

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        unitSelectReset.innerHTML = '';
        UNITS.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u;
          opt.textContent = u;
          unitSelectReset.appendChild(opt);
        });
        unitSelectError.textContent = '';
        unitSelectOverlay.style.display = 'grid';
      });
    }

    unitSelectConfirm.addEventListener('click', function () {
      const selectedUnit = unitSelectReset.value;
      if (!selectedUnit) {
        unitSelectError.textContent = 'Please select a unit.';
        return;
      }
      resetSelectedUnit(selectedUnit);
      unitSelectOverlay.style.display = 'none';
    });

    unitSelectCancel.addEventListener('click', function () {
      unitSelectOverlay.style.display = 'none';
    });

    const recordsBtn = document.getElementById('recordsBtn');
    const recordsOverlay = document.getElementById('recordsOverlay');
    const recordsClose = document.getElementById('recordsClose');
    const recordsPrint = document.getElementById('recordsPrint');

    if (recordsBtn) {
      recordsBtn.addEventListener('click', function () {
        renderRecords();
        recordsOverlay.style.display = 'grid';
      });
    }
    if (recordsClose) {
      recordsClose.addEventListener('click', function () {
        recordsOverlay.style.display = 'none';
      });
    }
    if (recordsPrint) {
      recordsPrint.addEventListener('click', function () {
        window.print();
      });
    }

    const overlay = document.getElementById('passwordOverlay');
    const passwordInput = document.getElementById('adminPassword');
    const errorEl = document.getElementById('passwordError');

    overlay.style.display = 'grid';

    const confirmHandler = function () {
      const entered = passwordInput.value;
      if (entered === ADMIN_PASSWORD) {
        overlay.style.display = 'none';
        renderAdminPanel();
      } else {
        errorEl.textContent = 'Incorrect password. Access denied.';
        passwordInput.value = '';
      }
      document.removeEventListener('keydown', keyHandler);
    };
    const cancelHandler = function () {
      overlay.style.display = 'none';
      window.location.href = 'index.html';
      document.removeEventListener('keydown', keyHandler);
    };
    const keyHandler = function (e) {
      if (e.key === 'Enter') confirmHandler();
      if (e.key === 'Escape') cancelHandler();
    };

    document.getElementById('passwordConfirm').addEventListener('click', confirmHandler);
    document.getElementById('passwordCancel').addEventListener('click', cancelHandler);
    document.addEventListener('keydown', keyHandler);
    passwordInput.focus();
  });
})();
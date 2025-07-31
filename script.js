document.addEventListener('DOMContentLoaded', function() {
    
    // --- FUNGSI PENYIMPANAN DAN PEMUATAN DATA ---

    function saveDataToLocalStorage() {
        localStorage.setItem('togelupStaffData', JSON.stringify(staffData));
    }

    function loadDataFromLocalStorage() {
        const data = localStorage.getItem('togelupStaffData');
        return data ? JSON.parse(data) : [];
    }

    // --- INISIALISASI DATA ---
    let staffData = loadDataFromLocalStorage();
    let currentFilter = 'all';

    // --- DOM ELEMENT SELECTION ---
    const menuLinks = document.querySelectorAll('.menu-list a[data-filter]');
    const tableBody = document.getElementById('staff-table-body');
    const tableTitle = document.getElementById('table-title');
    const addModal = document.getElementById('addModal');
    const editModal = document.getElementById('editModal');
    const tambahBtn = document.getElementById('tambah-staff-btn');

    // --- HELPER FUNCTION: MENGHITUNG MASA JABATAN ---
    function calculateMasaJabatan(startDateString) {
        if (!startDateString) return "N/A";
        const startDate = new Date(startDateString);
        if (isNaN(startDate.getTime())) return "Format Salah";
        
        const today = new Date();
        let years = today.getFullYear() - startDate.getFullYear();
        let months = today.getMonth() - startDate.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < startDate.getDate())) {
            years--;
            months = (months + 12) % 12;
        }
        return `${years} Thn ${months} Bln`;
    }

    // --- FUNGSI RENDER UTAMA ---
    function updateDashboard() {
        const totals = {
            cs: staffData.filter(s => s.jabatan.toLowerCase() === 'cs' && s.status === 'aktif').length,
            kapten: staffData.filter(s => s.jabatan.toLowerCase() === 'kapten' && s.status === 'aktif').length,
            kasir: staffData.filter(s => s.jabatan.toLowerCase() === 'kasir' && s.status === 'aktif').length,
            phk: staffData.filter(s => s.status === 'phk').length
        };
        document.getElementById('total-cs-summary').textContent = totals.cs;
        document.getElementById('total-kapten-summary').textContent = totals.kapten;
        document.getElementById('total-kasir-summary').textContent = totals.kasir;
        document.getElementById('total-phk-summary').textContent = totals.phk;

        let filteredData;
        let title;
        if (currentFilter === 'all') {
            title = "Semua Staff Aktif";
            filteredData = staffData.filter(s => s.status === 'aktif');
        } else if (currentFilter === 'phk') {
            title = "Data Staff PHK";
            filteredData = staffData.filter(s => s.status === 'phk');
        } else {
            title = `Data Staff Jabatan ${currentFilter.toUpperCase()}`;
            filteredData = staffData.filter(s => s.jabatan.toLowerCase() === currentFilter && s.status === 'aktif');
        }
        tableTitle.textContent = title;

        tableBody.innerHTML = '';
        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Tidak ada data.</td></tr>`;
        } else {
            filteredData.forEach((staff, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${index + 1}</td><td>${staff.nama}</td><td>${staff.passport}</td><td>${staff.jabatan}</td><td>${staff.email}</td><td>${calculateMasaJabatan(staff.tanggal_bergabung)}</td><td>${staff.last_admin || '-'}</td><td><button class="action-btn" data-id="${staff.id}">Edit</button></td>`;
                tableBody.appendChild(row);
            });
        }
        feather.replace();
    }

    function openModal(modal) { modal.classList.remove('hidden'); }
    function closeModal(modal) { modal.classList.add('hidden'); }

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentFilter = link.getAttribute('data-filter');
            updateDashboard();
        });
    });

    tambahBtn.addEventListener('click', () => {
        document.getElementById('addForm').reset();
        openModal(addModal);
    });

    tableBody.addEventListener('click', (e) => {
        if (e.target.matches('.action-btn')) {
            const staffId = parseInt(e.target.getAttribute('data-id'));
            const staff = staffData.find(s => s.id === staffId);
            if (staff) {
                document.getElementById('edit-staff-id').value = staff.id;
                document.getElementById('edit-nama').value = staff.nama;
                document.getElementById('edit-passport').value = staff.passport;
                document.getElementById('edit-jabatan').value = staff.jabatan;
                document.getElementById('edit-email').value = staff.email;
                document.getElementById('edit-tanggal-bergabung').value = staff.tanggal_bergabung;
                document.getElementById('edit-admin').value = staff.last_admin || '';
                openModal(editModal);
            }
        }
    });

    document.getElementById('save-new-staff-btn').addEventListener('click', () => {
        const newStaff = {
            id: staffData.length > 0 ? Math.max(...staffData.map(s => s.id)) + 1 : 1,
            nama: document.getElementById('add-nama').value,
            passport: document.getElementById('add-passport').value,
            jabatan: document.getElementById('add-jabatan').value,
            email: document.getElementById('add-email').value,
            tanggal_bergabung: document.getElementById('add-tanggal-bergabung').value,
            status: 'aktif',
            last_admin: document.getElementById('add-admin').value
        };
        if (!newStaff.nama || !newStaff.passport || !newStaff.email || !newStaff.tanggal_bergabung || !newStaff.last_admin) {
            alert("Harap isi semua field."); return;
        }
        staffData.push(newStaff);
        saveDataToLocalStorage();
        closeModal(addModal);
        updateDashboard();
    });
    document.getElementById('cancel-add-btn').addEventListener('click', () => closeModal(addModal));
    document.getElementById('close-add-modal').addEventListener('click', () => closeModal(addModal));

    document.getElementById('save-changes-btn').addEventListener('click', () => {
        const staffId = parseInt(document.getElementById('edit-staff-id').value);
        const staffIndex = staffData.findIndex(s => s.id === staffId);
        if (staffIndex > -1) {
            staffData[staffIndex].nama = document.getElementById('edit-nama').value;
            staffData[staffIndex].passport = document.getElementById('edit-passport').value;
            staffData[staffIndex].jabatan = document.getElementById('edit-jabatan').value;
            staffData[staffIndex].email = document.getElementById('edit-email').value;
            staffData[staffIndex].tanggal_bergabung = document.getElementById('edit-tanggal-bergabung').value;
            staffData[staffIndex].last_admin = document.getElementById('edit-admin').value;
        }
        saveDataToLocalStorage();
        closeModal(editModal);
        updateDashboard();
    });
    document.getElementById('cancel-edit-btn').addEventListener('click', () => closeModal(editModal));
    document.getElementById('close-edit-modal').addEventListener('click', () => closeModal(editModal));

    // --- [LOGIKA BARU] SINKRONISASI ANTAR TAB ---
    window.addEventListener('storage', function(event) {
        // Cek apakah data yang berubah adalah data staff kita
        if (event.key === 'togelupStaffData') {
            console.log("Perubahan terdeteksi dari tab lain, memuat ulang data...");
            // Muat ulang data dari localStorage yang baru
            staffData = loadDataFromLocalStorage();
            // Perbarui tampilan di tab ini
            updateDashboard();
        }
    });

    // --- INITIAL RENDER ---
    updateDashboard();
});

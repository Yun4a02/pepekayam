document.addEventListener('DOMContentLoaded', function() {
    
    // --- [PERUBAHAN 1] INISIALISASI FIREBASE ---
    // PASTE KODE firebaseConfig ANDA YANG SUDAH DICOPY DI SINI
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "..."
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(); // Membuat koneksi ke Firestore Database

    // --- INISIALISASI DATA ---
    let staffData = []; // Array ini akan selalu diisi oleh listener real-time
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

    // --- FUNGSI RENDER UTAMA (Tidak banyak berubah) ---
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

    // --- [PERUBAHAN 2] LISTENER REAL-TIME DARI DATABASE ---
    db.collection("staff").onSnapshot((querySnapshot) => {
        let freshData = [];
        querySnapshot.forEach((doc) => {
            // Menggabungkan data dari server dengan ID uniknya
            freshData.push({ id: doc.id, ...doc.data() });
        });
        staffData = freshData; // Update data lokal dengan data dari server
        console.log("Data baru dari server diterima. Memperbarui tampilan...");
        updateDashboard(); // Perbarui seluruh tampilan
    });

    // --- EVENT LISTENERS (Logika Modal diubah) ---
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
            const staffId = e.target.getAttribute('data-id');
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

    // --- [PERUBAHAN 3] LOGIKA MODAL UNTUK BERBICARA DENGAN FIREBASE ---
    document.getElementById('save-new-staff-btn').addEventListener('click', () => {
        const newStaff = {
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
        
        // Kirim data ke Firebase, bukan ke array lokal lagi
        db.collection("staff").add(newStaff).then(() => {
            console.log("Data berhasil ditambahkan ke server");
            closeModal(addModal);
        }).catch(error => console.error("Error menambah data: ", error));
    });
    document.getElementById('cancel-add-btn').addEventListener('click', () => closeModal(addModal));
    document.getElementById('close-add-modal').addEventListener('click', () => closeModal(addModal));

    document.getElementById('save-changes-btn').addEventListener('click', () => {
        const staffId = document.getElementById('edit-staff-id').value;
        const updatedData = {
            nama: document.getElementById('edit-nama').value,
            passport: document.getElementById('edit-passport').value,
            jabatan: document.getElementById('edit-jabatan').value,
            email: document.getElementById('edit-email').value,
            tanggal_bergabung: document.getElementById('edit-tanggal-bergabung').value,
            last_admin: document.getElementById('edit-admin').value,
        };
        
        // Update data di Firebase berdasarkan ID
        db.collection("staff").doc(staffId).update(updatedData).then(() => {
            console.log("Data berhasil diupdate di server");
            closeModal(editModal);
        }).catch(error => console.error("Error mengupdate data: ", error));
    });

    // FUNGSI BARU: Hapus Data
    document.getElementById('delete-staff-btn').addEventListener('click', () => {
        const staffId = document.getElementById('edit-staff-id').value;
        if (confirm("Apakah Anda yakin ingin menghapus staff ini?")) {
            db.collection("staff").doc(staffId).delete().then(() => {
                console.log("Data berhasil dihapus dari server");
                closeModal(editModal);
            }).catch(error => console.error("Error menghapus data: ", error));
        }
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', () => closeModal(editModal));
    document.getElementById('close-edit-modal').addEventListener('click', () => closeModal(editModal));
});

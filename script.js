document.addEventListener('DOMContentLoaded', function() {
    
    // --- KONFIGURASI DAN INISIALISASI FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyAQHj9r8c57128AvWT-o7ha3AbPy4W-0xI",
        authDomain: "datastaffupv2.firebaseapp.com",
        projectId: "datastaffupv2",
        storageBucket: "datastaffupv2.appspot.com", // Koreksi: ganti firebasestorage menjadi appspot
        messagingSenderId: "754508864683",
        appId: "1:754508864683:web:5fd4e6a5f7205729946bee",
        measurementId: "G-D3RH1HY3VB"
    };

    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    // Inisialisasi Firestore
    const db = firebase.firestore();
    const staffCollection = db.collection('staff');

    // --- STATE APLIKASI ---
    let staffData = []; // Data akan dimuat dari Firestore
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
                // Gunakan ID dari Firestore untuk atribut data-id
                row.innerHTML = `<td>${index + 1}</td><td>${staff.nama}</td><td>${staff.passport}</td><td>${staff.jabatan}</td><td>${staff.email}</td><td>${calculateMasaJabatan(staff.tanggal_bergabung)}</td><td>${staff.last_admin || '-'}</td><td><button class="action-btn" data-id="${staff.id}">Edit</button></td>`;
                tableBody.appendChild(row);
            });
        }
        feather.replace();
    }

    function openModal(modal) { modal.classList.remove('hidden'); }
    function closeModal(modal) { modal.classList.add('hidden'); }

    // --- SINKRONISASI REAL-TIME DENGAN FIRESTORE ---
    staffCollection.onSnapshot(snapshot => {
        console.log("Menerima pembaruan dari Firestore...");
        staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Urutkan data berdasarkan nama untuk konsistensi
        staffData.sort((a, b) => a.nama.localeCompare(b.nama));
        updateDashboard();
    }, error => {
        console.error("Gagal mengambil data dari Firestore: ", error);
        alert("Tidak dapat terhubung ke database. Cek koneksi internet dan konfigurasi Firebase Anda.");
    });

    // --- EVENT LISTENERS ---
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
            const staffId = e.target.getAttribute('data-id'); // ID sekarang adalah string dari Firestore
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
            nama: document.getElementById('add-nama').value,
            passport: document.getElementById('add-passport').value,
            jabatan: document.getElementById('add-jabatan').value,
            email: document.getElementById('add-email').value,
            tanggal_bergabung: document.getElementById('add-tanggal-bergabung').value,
            status: 'aktif',
            last_admin: document.getElementById('add-admin').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Tambahkan timestamp
        };
        if (!newStaff.nama || !newStaff.passport || !newStaff.email || !newStaff.tanggal_bergabung || !newStaff.last_admin) {
            alert("Harap isi semua field."); return;
        }
        
        // Simpan ke Firestore
        staffCollection.add(newStaff).then(() => {
            console.log("Staff baru berhasil ditambahkan!");
            closeModal(addModal);
            // Tampilan akan diperbarui secara otomatis oleh onSnapshot
        }).catch(error => {
            console.error("Gagal menyimpan staff baru: ", error);
            alert("Gagal menyimpan data ke database.");
        });
    });
    document.getElementById('cancel-add-btn').addEventListener('click', () => closeModal(addModal));
    document.getElementById('close-add-modal').addEventListener('click', () => closeModal(addModal));

    document.getElementById('save-changes-btn').addEventListener('click', () => {
        const staffId = document.getElementById('edit-staff-id').value;
        if (!staffId) return;

        const updatedData = {
            nama: document.getElementById('edit-nama').value,
            passport: document.getElementById('edit-passport').value,
            jabatan: document.getElementById('edit-jabatan').value,
            email: document.getElementById('edit-email').value,
            tanggal_bergabung: document.getElementById('edit-tanggal-bergabung').value,
            last_admin: document.getElementById('edit-admin').value
        };

        // Update data di Firestore
        staffCollection.doc(staffId).update(updatedData).then(() => {
            console.log("Data staff berhasil diperbarui!");
            closeModal(editModal);
            // Tampilan akan diperbarui secara otomatis oleh onSnapshot
        }).catch(error => {
            console.error("Gagal memperbarui data: ", error);
            alert("Gagal memperbarui data di database.");
        });
    });
    document.getElementById('cancel-edit-btn').addEventListener('click', () => closeModal(editModal));
    document.getElementById('close-edit-modal').addEventListener('click', () => closeModal(editModal));

    // Tidak perlu lagi event listener 'storage' karena Firestore menangani sinkronisasi
});

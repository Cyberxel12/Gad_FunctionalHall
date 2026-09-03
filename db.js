/**
 * Dimataling GAD Function Hall Reservation System - Central Database Engine
 * Uses Firebase Cloud Firestore & Auth for real-time multi-device cloud persistence
 * with automatic localStorage caching fallback.
 */

const DB = {
    KEYS: {
        USERS: 'gad_hall_users',
        RESERVATIONS: 'gad_hall_reservations',
        CURRENT_SESSION: 'gad_hall_current_session'
    },

    isFirebaseActive: false,
    db: null,
    auth: null,
    unsubscribeReservations: null,

    // Firebase Config Options (Dimataling GAD Live Cloud Database)
    firebaseConfig: {
        apiKey: "AIzaSyDJ98aqD4ZjBzRNM8PH4k8HhY4HGUCSfU8",
        authDomain: "dimataling-gad.firebaseapp.com",
        projectId: "dimataling-gad",
        storageBucket: "dimataling-gad.firebasestorage.app",
        messagingSenderId: "31910432733",
        appId: "1:31910432733:web:44bf4c277cad45da2db034",
        measurementId: "G-618LCY3D5T"
    },

    // Initialize database & Firebase connection
    init() {
        // 1. Initialize local cache defaults
        if (!localStorage.getItem(this.KEYS.USERS)) {
            const initialUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    email: 'admin@dimataling.gov.ph',
                    full_name: 'Administrator',
                    department: 'Facilities',
                    contact: '+63 912 345 6789',
                    role: 'admin',
                    profile_picture: ''
                }
            ];
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(initialUsers));
        } else {
            try {
                let users = JSON.parse(localStorage.getItem(this.KEYS.USERS));
                let adminIndex = users.findIndex(u => u.username === 'admin');
                if (adminIndex !== -1) {
                    users[adminIndex].password = 'admin123';
                    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
                }
            } catch (e) {}
        }

        if (!localStorage.getItem(this.KEYS.RESERVATIONS)) {
            localStorage.setItem(this.KEYS.RESERVATIONS, JSON.stringify([]));
        }

        // 2. Initialize Firebase if Web SDK is loaded
        this.initFirebase();
    },

    initFirebase() {
        if (typeof firebase !== 'undefined' && firebase.apps) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(this.firebaseConfig);
                }
                this.db = firebase.firestore();
                this.auth = firebase.auth();
                this.isFirebaseActive = true;
                console.log("🔥 Firebase Database Initialized Successfully!");
                
                // Initial Firestore data sync
                this.syncWithFirestore();
            } catch (err) {
                console.warn("Firebase initialization warning (using local mode):", err);
                this.isFirebaseActive = false;
            }
        }
    },

    syncWithFirestore() {
        if (!this.isFirebaseActive || !this.db) return;

        // Sync Users collection in real-time (merging local & cloud records across all devices)
        this.db.collection('users').onSnapshot(snapshot => {
            const localUsers = this.getUsers();
            const userMap = new Map();
            localUsers.forEach(u => userMap.set(u.id ? u.id.toString() : u.username, u));

            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const cloudUser = doc.data();
                    userMap.set(cloudUser.id ? cloudUser.id.toString() : cloudUser.username, cloudUser);
                });
            } else {
                // Seed initial users to Firestore
                localUsers.forEach(u => {
                    this.db.collection('users').doc(u.id.toString()).set(u);
                });
            }
            this.saveUsers(Array.from(userMap.values()));
        }, err => console.warn("Firestore users sync error:", err));

        // Sync Reservations collection
        this.db.collection('reservations').get().then(snapshot => {
            if (!snapshot.empty) {
                const resList = [];
                snapshot.forEach(doc => {
                    resList.push(doc.data());
                });
                resList.sort((a, b) => b.id - a.id);
                this.saveReservations(resList);
            } else {
                // Seed initial reservations to Firestore
                const localRes = this.getReservations();
                localRes.forEach(r => {
                    this.db.collection('reservations').doc(r.id.toString()).set(r);
                });
            }
        }).catch(err => console.warn("Firestore reservations fetch error:", err));
    },

    // Realtime Firestore Listener for Live Updates across Devices
    subscribeRealtimeUpdates(onUpdateCallback) {
        if (!this.isFirebaseActive || !this.db) return;

        if (this.unsubscribeReservations) this.unsubscribeReservations();

        this.unsubscribeReservations = this.db.collection('reservations')
            .onSnapshot(snapshot => {
                const updatedList = [];
                snapshot.forEach(doc => {
                    updatedList.push(doc.data());
                });
                updatedList.sort((a, b) => b.id - a.id);
                this.saveReservations(updatedList);

                if (typeof onUpdateCallback === 'function') {
                    onUpdateCallback(updatedList);
                }
            }, err => {
                console.warn("Firestore realtime snapshot error:", err);
            });
    },

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveUsers(users) {
        try {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        } catch (e) {
            console.warn("LocalStorage saveUsers warning (e.g. storage limit):", e);
        }
    },

    getReservations() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.RESERVATIONS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveReservations(reservations) {
        try {
            localStorage.setItem(this.KEYS.RESERVATIONS, JSON.stringify(reservations));
        } catch (e) {
            console.warn("LocalStorage saveReservations warning:", e);
        }
    },

    // Fast image compression helper (downscales high-res photos to tiny JPEG data URLs)
    compressImage(file, maxDimension = 250, quality = 0.7, callback = () => {}) {
        if (!file) {
            callback('');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                callback(compressedBase64);
            };
            img.onerror = function() {
                callback(e.target.result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    // Session Management
    getCurrentUser() {
        const sessionStr = sessionStorage.getItem(this.KEYS.CURRENT_SESSION) || localStorage.getItem(this.KEYS.CURRENT_SESSION);
        if (!sessionStr) return null;
        try {
            return JSON.parse(sessionStr);
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user, remember = false) {
        const sessionStr = JSON.stringify(user);
        if (remember) {
            localStorage.setItem(this.KEYS.CURRENT_SESSION, sessionStr);
        } else {
            sessionStorage.setItem(this.KEYS.CURRENT_SESSION, sessionStr);
        }
    },

    logout() {
        sessionStorage.removeItem(this.KEYS.CURRENT_SESSION);
        localStorage.removeItem(this.KEYS.CURRENT_SESSION);
        if (this.auth) {
            this.auth.signOut().catch(() => {});
        }
        window.location.href = 'login.html';
    },

    requireAuth(requiredRole = null) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        if (requiredRole && user.role !== requiredRole) {
            if (user.role === 'admin') {
                window.location.href = 'admin_dashboard.html';
            } else {
                window.location.href = 'user_dashboard.html';
            }
            return null;
        }
        return user;
    },

    // Authentication Actions
    login(identity, password, role, remember = false) {
        const users = this.getUsers();
        const cleanIdentity = identity.trim().toLowerCase();
        
        const user = users.find(u => 
            (u.username.toLowerCase() === cleanIdentity || u.email.toLowerCase() === cleanIdentity) && 
            u.password === password
        );

        if (user) {
            this.setCurrentUser(user, remember);
            return { success: true, user };
        } else {
            return { success: false, error: 'Invalid username/email or password.' };
        }
    },

    register(userData) {
        const users = this.getUsers();

        if (!userData.password || userData.password.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters long.' };
        }

        if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
            return { success: false, error: 'Username is already taken.' };
        }
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, error: 'Email address is already registered.' };
        }

        const newUser = {
            id: Date.now(),
            username: userData.username,
            password: userData.password,
            email: userData.email,
            full_name: userData.full_name,
            department: userData.department,
            contact: userData.contact,
            role: 'user',
            profile_picture: userData.profile_picture || ''
        };

        users.push(newUser);
        this.saveUsers(users);

        // Firestore async push
        if (this.isFirebaseActive && this.db) {
            this.db.collection('users').doc(newUser.id.toString()).set(newUser)
                .catch(err => console.warn("Firestore user insert error:", err));
        }

        return { success: true, user: newUser };
    },

    updateProfile(userId, updateData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updateData };
            this.saveUsers(users);

            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                const isRemembered = !!localStorage.getItem(this.KEYS.CURRENT_SESSION);
                this.setCurrentUser(users[index], isRemembered);
            }

            // Firestore update
            if (this.isFirebaseActive && this.db) {
                this.db.collection('users').doc(userId.toString()).update(updateData)
                    .catch(err => console.warn("Firestore profile update error:", err));
            }

            return { success: true, user: users[index] };
        }
        return { success: false, error: 'User not found' };
    },

    // Reservation Actions
    createReservation(resData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, error: 'User not logged in' };

        const reservations = this.getReservations();
        const newReservation = {
            id: Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            department: currentUser.department,
            event_title: resData.event_title,
            purpose: resData.purpose,
            event_date: resData.event_date,
            start_time: resData.start_time,
            end_time: resData.end_time,
            attendees: parseInt(resData.attendees, 10) || 1,
            contact_number: resData.contact_number || currentUser.contact,
            special_requests: resData.special_requests || '',
            status: 'Pending',
            admin_remarks: '',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        reservations.unshift(newReservation);
        this.saveReservations(reservations);

        // Firestore async push
        if (this.isFirebaseActive && this.db) {
            this.db.collection('reservations').doc(newReservation.id.toString()).set(newReservation)
                .catch(err => console.warn("Firestore reservation insert error:", err));
        }

        return { success: true, reservation: newReservation };
    },

    updateReservationStatus(resId, status, remarks = '') {
        const reservations = this.getReservations();
        const index = reservations.findIndex(r => r.id === resId);
        if (index !== -1) {
            reservations[index].status = status;
            reservations[index].admin_remarks = remarks;
            this.saveReservations(reservations);

            // Firestore update
            if (this.isFirebaseActive && this.db) {
                this.db.collection('reservations').doc(resId.toString()).update({
                    status: status,
                    admin_remarks: remarks
                }).catch(err => console.warn("Firestore status update error:", err));
            }

            return { success: true, reservation: reservations[index] };
        }
        return { success: false, error: 'Reservation not found' };
    },

    deleteReservation(resId) {
        const reservations = this.getReservations();
        const index = reservations.findIndex(r => r.id === resId);
        if (index !== -1) {
            reservations.splice(index, 1);
            this.saveReservations(reservations);

            // Firestore delete
            if (this.isFirebaseActive && this.db) {
                this.db.collection('reservations').doc(resId.toString()).delete()
                    .catch(err => console.warn("Firestore reservation delete error:", err));
            }

            return { success: true };
        }
        return { success: false, error: 'Reservation not found' };
    },

    deleteUser(userId) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            if (users[index].role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
                return { success: false, error: 'Cannot delete the last remaining admin account.' };
            }
            
            users.splice(index, 1);
            this.saveUsers(users);
            
            let reservations = this.getReservations();
            reservations = reservations.filter(r => r.user_id !== userId);
            this.saveReservations(reservations);

            // Firestore delete
            if (this.isFirebaseActive && this.db) {
                this.db.collection('users').doc(userId.toString()).delete()
                    .catch(err => console.warn("Firestore user delete error:", err));
            }
            
            return { success: true };
        }
        return { success: false, error: 'User not found' };
    },

    resetPasswordWithVerification(identity, contact, newPassword) {
        const users = this.getUsers();
        const user = users.find(u => 
            (u.username.toLowerCase() === identity.trim().toLowerCase() || u.email.toLowerCase() === identity.trim().toLowerCase())
        );

        if (!user) {
            return { success: false, error: 'No account found with that username or email address.' };
        }

        const cleanContact = (str) => (str || '').replace(/[^0-9]/g, '');
        if (!cleanContact(user.contact).includes(cleanContact(contact)) && !cleanContact(contact).includes(cleanContact(user.contact))) {
            return { success: false, error: 'The contact phone number provided does not match our records for this account.' };
        }

        user.password = newPassword;
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
            this.saveUsers(users);

            if (this.isFirebaseActive && this.db) {
                this.db.collection('users').doc(user.id.toString()).update({ password: newPassword })
                    .catch(err => console.warn("Firestore password reset error:", err));
            }

            return { success: true };
        }
        return { success: false, error: 'Failed to save updated password.' };
    },

    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    },

    findUserByIdentity(identity) {
        const users = this.getUsers();
        return users.find(u => 
            (u.username.toLowerCase() === identity.trim().toLowerCase() || u.email.toLowerCase() === identity.trim().toLowerCase())
        );
    },

    sendFirebasePasswordResetEmail(email) {
        if (this.isFirebaseActive && this.auth) {
            return this.auth.sendPasswordResetEmail(email)
                .then(() => ({ success: true, message: `Real password reset email sent to ${email} via Firebase Auth!` }))
                .catch((error) => ({ success: false, error: error.message }));
        }
        return Promise.resolve({ success: false, error: 'Firebase Auth is currently inactive.' });
    },

    resetPasswordDirect(userId, newPassword) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].password = newPassword;
            this.saveUsers(users);

            if (this.isFirebaseActive && this.db) {
                this.db.collection('users').doc(userId.toString()).update({ password: newPassword })
                    .catch(err => console.warn("Firestore direct password reset error:", err));
            }

            return { success: true };
        }
        return { success: false, error: 'User not found' };
    },

    format12HourTime(timeStr) {
        if (!timeStr) return '';
        if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        if (isNaN(hours)) return timeStr;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = hours < 10 ? '0' + hours : hours;
        return `${formattedHours}:${minutes} ${ampm}`;
    },

    // CSV Export Helpers
    exportToCSV(departmentFilter = null) {
        let reservations = this.getReservations();
        if (reservations.length === 0) {
            alert('No reservations available to export.');
            return;
        }

        if (departmentFilter && departmentFilter !== 'ALL') {
            reservations = reservations.filter(r => (r.department || '').toLowerCase() === departmentFilter.toLowerCase());
            if (reservations.length === 0) {
                alert(`No reservations found for department: ${departmentFilter}`);
                return;
            }
        }

        const safeDeptName = (departmentFilter && departmentFilter !== 'ALL')
            ? departmentFilter.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
            : 'all_departments';
        const filename = `gad_hall_reservations_${safeDeptName}.csv`;

        const headers = ['Department Name', 'Event Date', 'Time In', 'Time Out'];
        const rows = reservations.map(r => [
            `"${(r.department || '').replace(/"/g, '""')}"`,
            r.event_date,
            this.format12HourTime(r.start_time),
            this.format12HourTime(r.end_time)
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    exportByDepartmentSeparated() {
        const reservations = this.getReservations();
        if (reservations.length === 0) {
            alert('No reservations available to export.');
            return;
        }

        const depts = [...new Set(reservations.map(r => r.department || 'Unspecified'))];
        depts.forEach((dept, index) => {
            setTimeout(() => {
                this.exportToCSV(dept);
            }, index * 300);
        });
    },

    exportApprovedUserCSV(userId = null) {
        const reservations = this.getReservations();
        let approvedRes = reservations.filter(r => r.status.toLowerCase() === 'approved');
        if (userId) {
            approvedRes = approvedRes.filter(r => r.user_id === userId);
        }

        if (approvedRes.length === 0) {
            alert('No approved meetings available to export.');
            return false;
        }

        approvedRes.sort((a, b) => {
            const dateTimeA = `${a.event_date || ''}T${a.start_time || '00:00'}`;
            const dateTimeB = `${b.event_date || ''}T${b.start_time || '00:00'}`;
            return dateTimeA.localeCompare(dateTimeB);
        });

        const filename = `approved_meetings_ascending.csv`;
        const headers = ['Department Name', 'Event Date', 'Time In', 'Time Out'];
        const rows = approvedRes.map(r => [
            `"${(r.department || '').replace(/"/g, '""')}"`,
            r.event_date,
            this.format12HourTime(r.start_time),
            this.format12HourTime(r.end_time)
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }
};

// Auto initialize DB on script load
DB.init();

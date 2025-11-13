
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { ref, onValue, off, set, update, remove, push, serverTimestamp, get, query, orderByChild, equalTo } from 'firebase/database';
import { IconShoppingBag, IconUsers, IconClipboard, IconSettings, IconLogOut, IconPlusCircle, IconTicket, IconQrcode } from '../constants';
import { Product, UserProfile, PendingOrder, PurchaseHistoryItem, Ticket, PurchasedTicket } from '../types';
import { Spinner } from '../components/Spinner';
import Modal from '../components/Modal';

declare const Html5Qrcode: any;

// --- Confirmation Modal ---
const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p>{message}</p>
            <div className="flex justify-end gap-4 mt-4">
                <button onClick={onClose} className="bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-md hover:bg-gray-400 transition-transform active:scale-95">Tidak</button>
                <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-transform active:scale-95">Ya, Hapus</button>
            </div>
        </Modal>
    );
};


// --- SECTIONS ---

const ProductManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        const productsRef = ref(db, 'products');
        const listener = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            const productList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setProducts(productList);
            setLoading(false);
        });
        return () => off(productsRef, 'value', listener);
    }, []);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const productsRef = ref(db, 'products');
        const newProductRef = push(productsRef);
        
        const productData: Omit<Product, 'id'> = {
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            stock: newProduct.stock,
            imageUrl: newProduct.imageUrl,
            isAvailable: true,
        };

        await set(newProductRef, productData);
        setNewProduct({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });
        setModalOpen(false);
    };

    const handleUpdate = (id: string, field: keyof Product, value: any) => {
        const productRef = ref(db, `products/${id}/${field}`);
        set(productRef, value);
    };

    const handleDelete = (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const confirmDeletion = () => {
        if (confirmDelete.id) {
            const productRef = ref(db, `products/${confirmDelete.id}`);
            remove(productRef);
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;
    
    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Kelola Produk</h2>
                <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">
                    <IconPlusCircle /> Tambah Produk
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                         <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Gambar</th>
                            <th className="text-left p-2">Nama</th>
                            <th className="text-left p-2">Stok</th>
                            <th className="text-left p-2">Harga</th>
                            <th className="text-left p-2">Tersedia</th>
                            <th className="text-left p-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b dark:border-gray-700">
                                <td className="p-2"><img src={p.imageUrl} alt={p.name} className="w-16 h-12 object-cover rounded" onError={(e) => { e.currentTarget.src = 'https://picsum.photos/160/120' }}/></td>
                                <td className="p-2">{p.name}</td>
                                <td className="p-2"><input type="number" value={p.stock} onChange={e => handleUpdate(p.id, 'stock', Number(e.target.value))} className="w-20 p-1 border rounded dark:bg-gray-700"/></td>
                                <td className="p-2"><input type="number" value={p.price} onChange={e => handleUpdate(p.id, 'price', Number(e.target.value))} className="w-24 p-1 border rounded dark:bg-gray-700"/></td>
                                <td className="p-2"><input type="checkbox" checked={p.isAvailable} onChange={e => handleUpdate(p.id, 'isAvailable', e.target.checked)} className="h-5 w-5 text-blue-500 focus:ring-blue-400"/></td>
                                <td className="p-2"><button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 transition-transform active:scale-95">Hapus</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Tambah Produk Baru">
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <input type="text" placeholder="Nama Produk" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <textarea placeholder="Deskripsi Produk" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"></textarea>
                    <input type="url" placeholder="URL Gambar Produk" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <input type="number" placeholder="Harga" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <input type="number" placeholder="Stok" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <button type="submit" className="w-full bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">Tambah Produk</button>
                </form>
            </Modal>
            <ConfirmationModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={confirmDeletion}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat diurungkan."
            />
        </div>
    );
};

const UserManagement = () => {
    // ... (This section remains largely the same, but adding animation to button)
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const listener = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const userList = data ? Object.values(data) as UserProfile[] : [];
            setUsers(userList);
            setLoading(false);
        });
        return () => off(usersRef, 'value', listener);
    }, []);

    const handlePasswordReset = (email: string) => {
        if (window.confirm(`Kirim email reset password ke ${email}?`)) {
            sendPasswordResetEmail(auth, email)
                .then(() => alert(`Email reset password telah dikirim ke ${email}`))
                .catch(error => alert(`Error: ${error.message}`));
        }
    };
    
    const openUserModal = (user: UserProfile) => {
        setSelectedUser(user);
        setModalOpen(true);
    }

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Kelola Pengguna ({users.length})</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Total Belanja</th>
                             <th className="text-left p-2">Main MB</th>
                            <th className="text-left p-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.uid} className="border-b dark:border-gray-700">
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">Rp {(u.totalSpent || 0).toLocaleString()}</td>
                                <td className="p-2">{u.mysteryBoxPlays || 0}</td>
                                <td className="p-2">
                                    <button onClick={() => openUserModal(u)} className="text-blue-500 hover:underline transition-transform active:scale-95">Detail</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedUser && (
                <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={`Detail Pengguna: ${selectedUser.email}`}>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Informasi Pengguna</h3>
                        <p><span className="font-semibold">UID:</span> {selectedUser.uid}</p>
                        <p><span className="font-semibold">Email:</span> {selectedUser.email}</p>
                        <p><span className="font-semibold">Password:</span> ********** (Tidak dapat dilihat untuk keamanan)</p>
                        <p><span className="font-semibold">Total Belanja:</span> Rp {(selectedUser.totalSpent || 0).toLocaleString()}</p>
                        <p><span className="font-semibold">Total Main Mystery Box:</span> {selectedUser.mysteryBoxPlays || 0}</p>
                        
                        <h3 className="font-bold text-lg mt-4 mb-2">Tindakan</h3>
                        <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">Anda tidak dapat mengubah email atau password secara langsung. Mintalah pengguna untuk melakukannya dari halaman profil mereka atau kirim email reset password.</p>
                        <button onClick={() => handlePasswordReset(selectedUser.email)} className="bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">
                            Kirim Email Reset Password
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const OrderConfirmation = () => {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ordersRef = ref(db, 'pendingOrders');
        const listener = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            const orderList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setOrders(orderList);
            setLoading(false);
        });
        return () => off(ordersRef, 'value', listener);
    }, []);

    const handleConfirm = async (order: PendingOrder) => {
        const updates: { [key: string]: any } = {};
        const timestamp = Date.now();
        const userProfileRef = ref(db, `users/${order.userId}`);
        const userProfileSnap = await get(userProfileRef);
        const userProfile = userProfileSnap.val();
        
        // 1. Add to purchase history
        updates[`/users/${order.userId}/purchaseHistory/${order.id}`] = {
            name: order.itemName,
            type: order.type,
            price: order.price,
            timestamp
        };
        
        // 2. Send message & notification
        const messageId = push(ref(db, `users/${order.userId}/messages`)).key;
        const notifId = push(ref(db, `users/${order.userId}/notifications`)).key;
        updates[`/users/${order.userId}/messages/${messageId}`] = { text: `Pesanan Anda untuk ${order.itemName} telah dikonfirmasi!`, read: false, timestamp };
        updates[`/users/${order.userId}/notifications/${notifId}`] = { text: `Pembelian berhasil: ${order.itemName}.`, read: false, timestamp };

        // 3. Update user total spent
        updates[`/users/${order.userId}/totalSpent`] = (userProfile.totalSpent || 0) + order.price;
        
        // 4. Handle item-specific logic
        if (order.type === 'product') {
            const productRef = ref(db, `products/${order.itemId}`);
            const productSnap = await get(productRef);
            if(productSnap.exists()) {
                const product = productSnap.val();
                updates[`/products/${order.itemId}/stock`] = product.stock - 1;
            }
        } else if (order.type === 'ticket') {
            const newTicketRef = push(ref(db, `users/${order.userId}/purchasedTickets`));
            const barcodeValue = newTicketRef.key!; // Use firebase push key as unique barcode
            updates[`users/${order.userId}/purchasedTickets/${barcodeValue}`] = {
                ticketId: order.itemId,
                name: order.itemName,
                purchaseTimestamp: timestamp,
                barcodeValue: barcodeValue,
                isUsed: false,
            };
            // For easy scanning lookup
            updates[`allTickets/${barcodeValue}`] = {
                userId: order.userId,
                userEmail: order.userEmail,
                ticketName: order.itemName,
                purchaseTimestamp: timestamp,
                isUsed: false,
            };
        }
        else { // Mystery Box
            updates[`/users/${order.userId}/mysteryBoxState/canOpen`] = true;
        }

        // 5. Remove from pending
        updates[`/pendingOrders/${order.id}`] = null;

        await update(ref(db), updates);
        alert('Pesanan dikonfirmasi!');
    };
    
    const handleReject = async (order: PendingOrder) => {
        const updates: { [key:string]: any } = {};
        const notifId = push(ref(db, `users/${order.userId}/notifications`)).key;
        updates[`/users/${order.userId}/notifications/${notifId}`] = { text: `Pembelian Anda untuk ${order.itemName} ditolak.`, read: false, timestamp: Date.now() };
        updates[`/pendingOrders/${order.id}`] = null;
        await update(ref(db), updates);
        alert('Pesanan ditolak!');
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Konfirmasi Pesanan ({orders.length})</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Pengguna</th>
                            <th className="text-left p-2">Item</th>
                            <th className="text-left p-2">Tipe</th>
                            <th className="text-left p-2">Tanggal</th>
                            <th className="text-left p-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{o.userEmail}</td>
                                <td className="p-2">{o.itemName}</td>
                                <td className="p-2 capitalize">{o.type.replace('_',' ')}</td>
                                <td className="p-2">{new Date(o.timestamp).toLocaleString('id-ID')}</td>
                                <td className="p-2 space-x-2">
                                    <button onClick={() => handleConfirm(o)} className="bg-green-500 text-white px-3 py-1 rounded transition-transform active:scale-95">Konfirmasi</button>
                                    <button onClick={() => handleReject(o)} className="bg-red-500 text-white px-3 py-1 rounded transition-transform active:scale-95">Tolak</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MysteryBoxManagement = () => {
    // ... This section remains the same
     const [usersWithMB, setUsersWithMB] = useState<(UserProfile & { mbState?: any })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const listener = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const userList: (UserProfile & { mbState?: any })[] = data ? 
                Object.keys(data)
                    .map(uid => ({ uid, ...data[uid], mbState: data[uid].mysteryBoxState }))
                    .filter(u => u.mysteryBoxPlays > 0 || u.mbState)
                : [];
            setUsersWithMB(userList);
            setLoading(false);
        });
        return () => off(usersRef, 'value', listener);
    }, []);

    const handleStateChange = (uid: string, field: 'willWin', value: boolean) => {
        const stateRef = ref(db, `users/${uid}/mysteryBoxState/${field}`);
        set(stateRef, value);
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Kelola Mystery Box</h2>
            <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">Atur hasil untuk permainan Mystery Box pengguna. Opsi "Aktifkan Main" sekarang otomatis melalui Konfirmasi Pesanan.</p>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Pengguna</th>
                            <th className="text-left p-2">Status Bisa Main</th>
                            <th className="text-left p-2">Atur sebagai Pemenang</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersWithMB.map(u => (
                            <tr key={u.uid} className="border-b dark:border-gray-700">
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">{u.mbState?.canOpen ? 'YA' : 'TIDAK'}</td>
                                <td className="p-2"><input type="checkbox" defaultChecked={u.mbState?.willWin || false} onChange={e => handleStateChange(u.uid, 'willWin', e.target.checked)} className="h-5 w-5 text-blue-500 focus:ring-blue-400"/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TicketManagement = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [salesActive, setSalesActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ name: '', description: '', price: 0 });
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        const ticketsRef = ref(db, 'tickets');
        const settingsRef = ref(db, 'ticketSettings/salesActive');
        const ticketsListener = onValue(ticketsRef, (snapshot) => {
            const data = snapshot.val();
            const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setTickets(list);
            setLoading(false);
        });
        const settingsListener = onValue(settingsRef, (snapshot) => {
            setSalesActive(snapshot.val() ?? true);
        });
        return () => {
            off(ticketsRef, 'value', ticketsListener);
            off(settingsRef, 'value', settingsListener);
        };
    }, []);

    const handleToggleSales = (isActive: boolean) => {
        set(ref(db, 'ticketSettings/salesActive'), isActive);
    };

    const handleAddTicket = (e: React.FormEvent) => {
        e.preventDefault();
        const newTicketRef = push(ref(db, 'tickets'));
        set(newTicketRef, { ...newTicket, isAvailable: true });
        setNewTicket({ name: '', description: '', price: 0 });
        setModalOpen(false);
    };
    
    const handleUpdate = (id: string, field: keyof Ticket, value: any) => {
        set(ref(db, `tickets/${id}/${field}`), value);
    };

    const handleDelete = (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const confirmDeletion = () => {
        if(confirmDelete.id) {
            remove(ref(db, `tickets/${confirmDelete.id}`));
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Kelola Tiket</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label>Penjualan Aktif</label>
                        <input type="checkbox" checked={salesActive} onChange={e => handleToggleSales(e.target.checked)} className="h-5 w-5 text-blue-500"/>
                    </div>
                    <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">
                        <IconPlusCircle /> Tambah Tiket
                    </button>
                </div>
            </div>
            {/* Table and Modal similar to ProductManagement */}
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                         <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Nama Tiket</th>
                            <th className="text-left p-2">Harga</th>
                            <th className="text-left p-2">Tersedia</th>
                            <th className="text-left p-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(t => (
                            <tr key={t.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{t.name}</td>
                                <td className="p-2"><input type="number" value={t.price} onChange={e => handleUpdate(t.id, 'price', Number(e.target.value))} className="w-24 p-1 border rounded dark:bg-gray-700"/></td>
                                <td className="p-2"><input type="checkbox" checked={t.isAvailable} onChange={e => handleUpdate(t.id, 'isAvailable', e.target.checked)} className="h-5 w-5 text-blue-500 focus:ring-blue-400"/></td>
                                <td className="p-2"><button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 transition-transform active:scale-95">Hapus</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Tambah Tiket Baru">
                <form onSubmit={handleAddTicket} className="space-y-4">
                    <input type="text" placeholder="Nama Tiket" value={newTicket.name} onChange={e => setNewTicket({...newTicket, name: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <textarea placeholder="Deskripsi Tiket" value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"></textarea>
                    <input type="number" placeholder="Harga" value={newTicket.price} onChange={e => setNewTicket({...newTicket, price: Number(e.target.value)})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <button type="submit" className="w-full bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">Tambah Tiket</button>
                </form>
            </Modal>
             <ConfirmationModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={confirmDeletion}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus tiket ini?"
            />
        </div>
    );
};

const TicketScanner = () => {
    const scannerRef = useRef<any>(null);
    const [scanResult, setScanResult] = useState<any>(null);
    const [scanError, setScanError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const html5QrcodeScanner = new Html5Qrcode("reader");
        scannerRef.current = html5QrcodeScanner;

        const startScanner = () => {
            html5QrcodeScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                setScanError("Gagal memulai kamera. Pastikan Anda memberikan izin kamera.");
                console.error("Camera start error:", err);
            });
        };

        const onScanSuccess = (decodedText: string) => {
            html5QrcodeScanner.pause(true);
            verifyTicket(decodedText);
        };
    
        const onScanFailure = (error: string) => {
            // console.warn(`Code scan error = ${error}`);
        };

        startScanner();
    
        return () => {
            if (scannerRef.current && scannerRef.current.getState() === 2) { // 2 is SCANNING state
                scannerRef.current.stop().catch((err: any) => console.error("Scanner stop failed", err));
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifyTicket = async (barcodeValue: string) => {
        setIsLoading(true);
        setScanError('');
        setScanResult(null);

        const ticketRef = ref(db, `allTickets/${barcodeValue}`);
        const snapshot = await get(ticketRef);

        if (snapshot.exists()) {
            setScanResult({ id: barcodeValue, ...snapshot.val() });
        } else {
            setScanError("Tiket tidak valid atau tidak ditemukan.");
        }
        setIsLoading(false);
    };

    const markTicketAsUsed = async () => {
        if (!scanResult) return;
        const updates: { [key: string]: any } = {};
        const timestamp = Date.now();
        updates[`allTickets/${scanResult.id}/isUsed`] = true;
        updates[`allTickets/${scanResult.id}/usedTimestamp`] = timestamp;
        updates[`users/${scanResult.userId}/purchasedTickets/${scanResult.id}/isUsed`] = true;
        updates[`users/${scanResult.userId}/purchasedTickets/${scanResult.id}/usedTimestamp`] = timestamp;
        await update(ref(db), updates);
        setScanResult({ ...scanResult, isUsed: true, usedTimestamp: timestamp });
        alert("Tiket berhasil ditandai sebagai sudah digunakan.");
    };

    const handleRescan = () => {
        setScanResult(null);
        setScanError('');
        if (scannerRef.current && scannerRef.current.getState() === 3) { // 3 is PAUSED state
             scannerRef.current.resume();
        }
    }

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Pindai Tiket Masuk</h2>
            <div id="reader" className="w-full"></div>
            {scanError && <p className="text-red-500 text-center mt-4">{scanError}</p>}
            {isLoading && <div className="flex justify-center mt-4"><Spinner /></div>}
            
            {scanResult && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${scanResult.isUsed ? 'border-red-500 bg-red-100 dark:bg-red-900' : 'border-green-500 bg-green-100 dark:bg-green-900'}`}>
                    <h3 className="font-bold text-lg">{scanResult.isUsed ? 'Tiket Sudah Digunakan' : 'Tiket Valid!'}</h3>
                    <p><strong>Nama Tiket:</strong> {scanResult.ticketName}</p>
                    <p><strong>Email Pembeli:</strong> {scanResult.userEmail}</p>
                    <p><strong>Tanggal Beli:</strong> {new Date(scanResult.purchaseTimestamp).toLocaleString('id-ID')}</p>
                    {scanResult.isUsed && <p><strong>Tanggal Digunakan:</strong> {new Date(scanResult.usedTimestamp).toLocaleString('id-ID')}</p>}
                    
                    <div className="flex gap-4 mt-4">
                        {!scanResult.isUsed && <button onClick={markTicketAsUsed} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-transform active:scale-95">Tandai Sudah Digunakan</button>}
                        <button onClick={handleRescan} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-transform active:scale-95">Pindai Lagi</button>
                    </div>
                </div>
            )}
        </div>
    );
};


const Reports = () => {
    // ... (This section remains largely the same, but with confirmation modal)
    const [allHistory, setAllHistory] = useState<(PurchaseHistoryItem & {userEmail: string})[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmOpen, setConfirmOpen] = useState(false);

     useEffect(() => {
        const usersRef = ref(db, 'users');
        const listener = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            const historyList: (PurchaseHistoryItem & {userEmail: string})[] = [];
            if (usersData) {
                for (const uid in usersData) {
                    if (usersData[uid].purchaseHistory) {
                        for(const historyId in usersData[uid].purchaseHistory) {
                            historyList.push({
                                id: historyId,
                                userEmail: usersData[uid].email,
                                ...usersData[uid].purchaseHistory[historyId]
                            });
                        }
                    }
                }
            }
            setAllHistory(historyList.sort((a,b) => b.timestamp - a.timestamp));
            setLoading(false);
        });
        return () => off(usersRef, 'value', listener);
    }, []);

    const handleDeleteReports = async () => {
        setLoading(true);
        const usersRef = ref(db, 'users');
        const usersSnap = await get(usersRef);
        if (usersSnap.exists()) {
            const updates: { [key: string]: null } = {};
            usersSnap.forEach((userSnapshot) => {
                updates[`/users/${userSnapshot.key}/purchaseHistory`] = null;
            });
            await update(ref(db), updates);
        }
        setLoading(false);
        setConfirmOpen(false);
        alert("Semua laporan penjualan telah dihapus.");
    };

    const processChartData = (days: number) => {
        const data: { [key: string]: number } = {};
        const labels: string[] = [];
        const now = new Date();
        
        for (let i = 0; i < days; i++) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            labels.unshift(key);
            data[key] = 0;
        }

        allHistory.forEach(item => {
            const key = new Date(item.timestamp).toISOString().split('T')[0];
            if (data[key] !== undefined) {
                data[key] += item.price || 0;
            }
        });
        
        return labels.map(label => ({ label: new Date(label).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), value: data[label] }));
    };

    const weeklyData = processChartData(7);
    const monthlyData = processChartData(30);

    const Chart = ({ data, title }: { data: {label: string, value: number}[], title: string }) => {
        const maxValue = Math.max(...data.map(d => d.value), 1);
        return (
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-center">{title}</h3>
                <div className="flex justify-around items-end h-64 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {data.map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center w-full">
                            <div 
                                className="w-3/4 bg-blue-500 hover:bg-blue-600 transition-all" 
                                style={{ height: `${(value / maxValue) * 100}%` }}
                                title={`Rp ${value.toLocaleString()}`}
                            ></div>
                            <span className="text-xs mt-2">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

     if (loading) return <div className="flex justify-center"><Spinner /></div>;

    const totalRevenue = allHistory.reduce((acc, item) => acc + (item.price || 0), 0);
    
    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Laporan Penjualan</h2>
                    <p className="font-semibold text-lg">Total Pendapatan: Rp {totalRevenue.toLocaleString()}</p>
                </div>
                <button onClick={() => setConfirmOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-transform active:scale-95">Hapus Laporan</button>
            </div>

            <Chart data={weeklyData} title="Penjualan 7 Hari Terakhir" />
            <Chart data={monthlyData} title="Penjualan 30 Hari Terakhir" />

             <div className="overflow-x-auto mt-6">
                <h3 className="text-xl font-semibold my-4">Riwayat Transaksi Lengkap</h3>
                <table className="min-w-full">
                    <thead>
                         <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Pengguna</th>
                            <th className="text-left p-2">Item</th>
                            <th className="text-left p-2">Harga</th>
                            <th className="text-left p-2">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allHistory.map(h => (
                            <tr key={`${h.id}-${h.userEmail}`} className="border-b dark:border-gray-700">
                                <td className="p-2">{h.userEmail}</td>
                                <td className="p-2">{h.name}</td>
                                <td className="p-2">Rp {(h.price || 0).toLocaleString()}</td>
                                <td className="p-2">{new Date(h.timestamp).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDeleteReports}
                title="Hapus Semua Laporan?"
                message="APAKAH ANDA YAKIN? Tindakan ini akan menghapus SEMUA riwayat penjualan secara permanen dan tidak dapat diurungkan."
            />
        </div>
    );
};

const AdminPanel: React.FC = () => {
    const { logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('orders');

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev);
    }, []);
    
    const handleViewChange = (view: string) => {
        if (view === 'logout') {
            logout();
        } else {
            setActiveView(view);
        }
    }

    const menuItems = [
        { name: 'Konfirmasi Pesanan', view: 'orders', icon: <IconClipboard /> },
        { name: 'Kelola Produk', view: 'products', icon: <IconShoppingBag /> },
        { name: 'Kelola Tiket', view: 'tickets', icon: <IconTicket /> },
        { name: 'Kelola Pengguna', view: 'users', icon: <IconUsers /> },
        { name: 'Kelola Mystery Box', view: 'mystery_box', icon: <IconSettings /> },
        { name: 'Scan Tiket', view: 'scan_ticket', icon: <IconQrcode /> },
        { name: 'Laporan', view: 'reports', icon: <IconClipboard /> },
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'products': return <ProductManagement />;
            case 'tickets': return <TicketManagement />;
            case 'users': return <UserManagement />;
            case 'orders': return <OrderConfirmation />;
            case 'mystery_box': return <MysteryBoxManagement />;
            case 'scan_ticket': return <TicketScanner />;
            case 'reports': return <Reports />;
            default: return <OrderConfirmation />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Header toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} activeView={activeView} setActiveView={setActiveView} menuItems={menuItems} isLoggedIn={true} onAdminClick={() => {}} />
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} activeView={activeView} setActiveView={handleViewChange} menuItems={[...menuItems, {name: 'Keluar', view: 'logout', icon: <IconLogOut />}]} isLoggedIn={true} onLogout={logout} onAdminClick={() => {}}/>
            
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};

export default AdminPanel;

import React, { useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { IconUser, IconMessage, IconBell, IconShoppingBag, IconBox, IconGift, IconHistory, IconLogOut, IconCheckCircle, IconXCircle, IconWhatsApp, IconTicket } from '../constants';
import { Message, Notification, Product, PurchaseHistoryItem, MysteryBoxState, PendingOrder, Ticket, PurchasedTicket } from '../types';
import { ref, onValue, off, update, push, serverTimestamp, set, query, orderByChild, equalTo } from 'firebase/database';
import Modal from '../components/Modal';
import { Spinner } from '../components/Spinner';

declare const jspdf: any;
declare const JsBarcode: any;

const Toast: React.FC<{ message: string; show: boolean; type: 'success' | 'error' }> = ({ message, show, type }) => {
    if (!show) return null;
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed bottom-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg animate-pulse`}>
            {message}
        </div>
    );
};

// --- SECTIONS ---
const ProfileSection: React.FC = () => {
    const { user } = useAuth();
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email || !currentPassword) {
            setMessage("Kata sandi saat ini diperlukan untuk membuat perubahan.");
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            if ('reauthenticateWithCredential' in user) {
                await reauthenticateWithCredential(user, credential);

                if (newEmail && newEmail !== user.email) {
                    await updateEmail(user, newEmail);
                    await update(ref(db), { [`users/${user.uid}/email`]: newEmail });
                    setMessage("Email berhasil diperbarui.");
                }
                if (newPassword) {
                    await updatePassword(user, newPassword);
                    setMessage(prev => prev + " Kata sandi berhasil diperbarui.");
                }
                 if (!newEmail && !newPassword) {
                    setMessage("Tidak ada perubahan yang dilakukan.");
                }
            } else {
                throw new Error("Operasi ini tidak tersedia untuk pengguna saat ini.");
            }
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setCurrentPassword('');
            setNewPassword('');
        }
    };
    
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Manajemen Profil</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Email Baru</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Kata Sandi Baru</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Biarkan kosong untuk tetap sama" className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Kata Sandi Saat Ini (Wajib)</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                {message && <p className="text-sm text-center text-blue-500">{message}</p>}
                <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-transform active:scale-95">
                    {loading ? <Spinner /> : "Perbarui Profil"}
                </button>
            </form>
        </div>
    );
};

const BuySection: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleBuy = (product: Product) => {
        if (!user) return;
        if (!product.isAvailable || product.stock <= 0) {
            setToast("Maaf, produk ini tidak tersedia.");
            return;
        }

        const pendingOrdersRef = ref(db, 'pendingOrders');
        const newOrderRef = push(pendingOrdersRef);
        set(newOrderRef, {
            userId: user.uid,
            userEmail: user.email,
            type: 'product',
            itemName: product.name,
            itemId: product.id,
            price: product.price,
            timestamp: serverTimestamp()
        });
        
        window.open('https://lynk.id/yustdan', '_blank');
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Produk Dijual</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" onError={(e) => { e.currentTarget.src = 'https://picsum.photos/400/300' }}/>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm flex-grow">{product.description}</p>
                            <div className="flex justify-between items-center mb-3 mt-auto">
                                <p className="text-lg font-bold text-blue-500">Rp {product.price.toLocaleString()}</p>
                                <p className="text-xs font-medium">{product.isAvailable && product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}</p>
                            </div>
                            <button 
                                onClick={() => handleBuy(product)} 
                                disabled={!product.isAvailable || product.stock <= 0}
                                className="w-full bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md hover:bg-yellow-600 transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {!product.isAvailable || product.stock <= 0 ? 'Produk Belum Tersedia' : 'Beli Sekarang'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BuyTicketSection: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [salesActive, setSalesActive] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ticketsRef = ref(db, 'tickets');
        const settingsRef = ref(db, 'ticketSettings/salesActive');

        const ticketsListener = onValue(ticketsRef, (snapshot) => {
            const data = snapshot.val();
            const ticketList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setTickets(ticketList);
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

    const handleBuy = (ticket: Ticket) => {
        if (!user || !salesActive || !ticket.isAvailable) {
            setToast("Penjualan tiket saat ini tidak tersedia.");
            return;
        }

        const pendingOrdersRef = ref(db, 'pendingOrders');
        const newOrderRef = push(pendingOrdersRef);
        set(newOrderRef, {
            userId: user.uid,
            userEmail: user.email,
            type: 'ticket',
            itemName: ticket.name,
            itemId: ticket.id,
            price: ticket.price,
            timestamp: serverTimestamp()
        });
        
        // You might want a different payment link for tickets
        window.open('https://lynk.id/yustdan', '_blank');
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;
    
    if (!salesActive) {
        return (
             <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Pembelian Tiket</h2>
                 <IconTicket />
                <p className="my-4 text-lg">Mohon maaf, penjualan tiket saat ini sedang ditutup. Silakan cek kembali nanti.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Beli Tiket</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
                        <div className="p-6 flex flex-col flex-grow">
                            <h3 className="text-xl font-semibold mb-2">{ticket.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">{ticket.description}</p>
                            <div className="flex justify-between items-center mt-auto mb-4">
                                <p className="text-lg font-bold text-blue-500">Rp {ticket.price.toLocaleString()}</p>
                                {!ticket.isAvailable && <p className="text-sm font-semibold text-red-500">Tidak Tersedia</p>}
                            </div>
                            <button 
                                onClick={() => handleBuy(ticket)} 
                                disabled={!ticket.isAvailable}
                                className="w-full bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md hover:bg-yellow-600 transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Beli Tiket
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MyTicketsSection: React.FC = () => {
    const { user } = useAuth();
    const [myTickets, setMyTickets] = useState<PurchasedTicket[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!user) return;
        const ticketsRef = ref(db, `users/${user.uid}/purchasedTickets`);
        const listener = onValue(ticketsRef, (snapshot) => {
            const data = snapshot.val();
            const ticketList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setMyTickets(ticketList.sort((a,b) => b.purchaseTimestamp - a.purchaseTimestamp));
            setLoading(false);
        });
        return () => off(ticketsRef, 'value', listener);
    }, [user]);

    const handleDownloadPdf = (ticket: PurchasedTicket) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
    
        doc.setFontSize(22);
        doc.text("TIKET ACARA RESMI - TOKOaing", 105, 20, { align: 'center' });
    
        doc.setFontSize(16);
        doc.text(`Nama Tiket: ${ticket.name}`, 20, 40);
        doc.text(`Tanggal Pembelian: ${new Date(ticket.purchaseTimestamp).toLocaleString('id-ID')}`, 20, 50);
        doc.text(`Status: ${ticket.isUsed ? `Digunakan pada ${new Date(ticket.usedTimestamp!).toLocaleString('id-ID')}` : 'VALID'}`, 20, 60);

        const canvas = document.createElement('canvas');
        JsBarcode(canvas, ticket.barcodeValue, {
            format: "CODE128",
            displayValue: true,
            fontSize: 18,
            textMargin: 0
        });

        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 30, 80, 150, 60);

        doc.setFontSize(10);
        doc.text("Harap tunjukkan barcode ini kepada panitia di pintu masuk.", 105, 160, { align: 'center' });

        doc.save(`tiket-${ticket.name.replace(/\s/g, '_')}-${ticket.id.slice(0, 5)}.pdf`);
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Tiket Saya</h2>
            <div className="space-y-4">
                {myTickets.length > 0 ? myTickets.map(ticket => (
                    <div key={ticket.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{ticket.name}</h3>
                            <p className="text-sm">{ticket.isUsed ? `Telah digunakan` : 'Aktif'}</p>
                        </div>
                        <button onClick={() => handleDownloadPdf(ticket)} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-transform active:scale-95">Unduh PDF</button>
                    </div>
                )) : (
                    <p>Anda belum memiliki tiket.</p>
                )}
            </div>
        </div>
    );
};

const MysteryBoxSection: React.FC = () => {
    // ... (This section remains unchanged, but I'll update button styles for animation)
    const { user, userProfile } = useAuth();
    const [boxState, setBoxState] = useState<MysteryBoxState | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [winResult, setWinResult] = useState(false);
    const [voucher, setVoucher] = useState('');
    const [hasPendingMBOrder, setHasPendingMBOrder] = useState(false);

    useEffect(() => {
        if (!user) return;
        const boxStateRef = ref(db, `users/${user.uid}/mysteryBoxState`);
        const listener = onValue(boxStateRef, (snapshot) => {
            setBoxState(snapshot.val());
        });

        const pendingOrdersRef = query(ref(db, 'pendingOrders'), orderByChild('userId'), equalTo(user.uid));
        const pendingListener = onValue(pendingOrdersRef, (snapshot) => {
            let pending = false;
            snapshot.forEach((child) => {
                const order = child.val();
                if (order.type === 'mystery_box') {
                    pending = true;
                }
            });
            setHasPendingMBOrder(pending);
        });

        return () => {
            off(boxStateRef, 'value', listener);
            off(pendingOrdersRef, 'value', pendingListener);
        }
    }, [user]);

    const handleBuyBox = () => {
        if (!user) return;
        const pendingOrdersRef = ref(db, 'pendingOrders');
        const newOrderRef = push(pendingOrdersRef);
        set(newOrderRef, {
            userId: user.uid,
            userEmail: user.email,
            type: 'mystery_box',
            itemName: 'Mystery Box',
            itemId: 'mystery-box-01',
            price: 50000, 
            timestamp: serverTimestamp()
        });
        window.open('http://lynk.id/yustdan/gmz9dn1dk1ek/checkout', '_blank');
    };

    const generateVoucherCode = () => 'VOUCHER-' + Math.random().toString(36).substring(2, 11).toUpperCase();

    const handleOpenBox = async () => {
        if (!user || !boxState || !boxState.canOpen) return;

        const wasWin = boxState.willWin;
        setWinResult(wasWin);

        const updates: { [key: string]: any } = {
            [`/users/${user.uid}/mysteryBoxState/canOpen`]: false,
            [`/users/${user.uid}/mysteryBoxPlays`]: (userProfile?.mysteryBoxPlays || 0) + 1,
        };

        if (wasWin) {
            const newVoucher = generateVoucherCode();
            setVoucher(newVoucher);
            const leaderboardRef = ref(db, 'mysteryBoxLeaderboard');
            const newWinRef = push(leaderboardRef);
            await set(newWinRef, {
                email: user.email,
                itemWon: newVoucher,
                timestamp: serverTimestamp()
            });
        }
        
        await update(ref(db), updates);
        setShowResultModal(true);
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Tantangan Mystery Box</h2>
            <IconBox className="mx-auto h-16 w-16 text-blue-500" />
            <p className="my-4">Uji keberuntunganmu! Beli Mystery Box untuk kesempatan memenangkan voucher eksklusif.</p>
            {hasPendingMBOrder && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 my-4 text-left rounded-r-lg">
                    <p className="font-bold">Tindakan Diperlukan</p>
                    <p>Silakan kirim bukti pembayaran Anda ke admin kami melalui WhatsApp.</p>
                    <a href="https://wa.me/6285817938860" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-transform active:scale-95">
                        <IconWhatsApp /> Kirim Bukti
                    </a>
                </div>
            )}
            <div className="my-6">
                <button onClick={handleBuyBox} className="bg-yellow-500 text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-yellow-600 transition-transform active:scale-95">
                    Beli Mystery Box (Rp 50,000)
                </button>
            </div>
            <div className="my-6">
                <button 
                    onClick={handleOpenBox} 
                    disabled={!boxState?.canOpen}
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {boxState?.canOpen ? 'Buka Kotakmu!' : 'Menunggu Konfirmasi Admin'}
                </button>
            </div>
            <p className="text-lg">Total Bermain: <span className="font-bold">{userProfile?.mysteryBoxPlays || 0}</span></p>

            <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Hasil Mystery Box">
                <div className="text-center">
                    {winResult ? (
                        <>
                            <IconCheckCircle className="mx-auto h-16 w-16 text-green-500" />
                            <h3 className="text-2xl font-bold text-green-500 mt-4">Selamat, Anda Menang!</h3>
                            <p className="my-2">Screenshot kode voucher ini dan kirim ke admin untuk klaim hadiahmu!</p>
                            <p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-lg tracking-widest">{voucher}</p>
                        </>
                    ) : (
                         <>
                            <IconXCircle className="mx-auto h-16 w-16 text-red-500"/>
                            <h3 className="text-2xl font-bold text-red-500 mt-4">Coba Lagi Nanti!</h3>
                            <p className="my-2">Sayangnya, kamu belum beruntung kali ini. Jangan menyerah!</p>
                        </>
                    )}
                     <button onClick={() => setShowResultModal(false)} className="mt-4 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">Tutup</button>
                </div>
            </Modal>
        </div>
    );
};

const RedeemVoucherSection: React.FC = () => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Cara Menukarkan Voucher</h2>
        <IconGift className="mx-auto h-16 w-16 text-yellow-500"/>
        <p className="my-4">Jika Anda memenangkan voucher dari Mystery Box, selamat!</p>
        <p>Untuk menukarkan hadiah Anda, silakan kirim screenshot kode voucher ke admin kami di WhatsApp.</p>
        <a href="https://wa.me/6285817938860" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-lg transition-transform active:scale-95">
            <IconWhatsApp /> Hubungi Admin Sekarang
        </a>
    </div>
);

const HistorySection: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const historyRef = ref(db, `users/${user.uid}/purchaseHistory`);
        const listener = onValue(historyRef, (snapshot) => {
            const data = snapshot.val();
            const historyList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setHistory(historyList.sort((a,b) => b.timestamp - a.timestamp));
            setLoading(false);
        });
        return () => off(historyRef, 'value', listener);
    }, [user]);

     if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Riwayat Pembelian</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left py-2 px-2">Item</th>
                            <th className="text-left py-2 px-2">Tipe</th>
                            <th className="text-left py-2 px-2">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length > 0 ? history.map(item => (
                            <tr key={item.id} className="border-b dark:border-gray-700">
                                <td className="py-2 px-2">{item.name}</td>
                                <td className="py-2 px-2 capitalize">{item.type.replace('_', ' ')}</td>
                                <td className="py-2 px-2">{new Date(item.timestamp).toLocaleString('id-ID')}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} className="text-center py-4">Tidak ada riwayat pembelian.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MessagesSection: React.FC<{ messages: Message[], onMarkAsRead: () => void }> = ({ messages, onMarkAsRead }) => {
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    useEffect(() => {
        onMarkAsRead();
    }, [onMarkAsRead]);

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Pesan dari Admin</h2>
                <a href="https://wa.me/6285817938860" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm transition-transform active:scale-95">
                    <IconWhatsApp /> Hubungi Admin
                </a>
            </div>
            <div className="space-y-2">
                {messages.length > 0 ? messages.map(msg => (
                    <div key={msg.id} onClick={() => setSelectedMessage(msg)} className={`p-3 rounded-lg cursor-pointer transition-colors ${msg.read ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100' : 'bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200'}`}>
                        <p className="font-semibold truncate">{msg.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(msg.timestamp).toLocaleString('id-ID')}</p>
                    </div>
                )) : <p>Tidak ada pesan.</p>}
            </div>

            <Modal isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} title={`Pesan dari ${selectedMessage ? new Date(selectedMessage.timestamp).toLocaleString('id-ID') : ''}`}>
                <p>{selectedMessage?.text}</p>
            </Modal>
        </div>
    );
};

const UserPanel: React.FC = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('buy');
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [toast, setToastState] = useState({ message: '', show: false, type: 'success' as 'success' | 'error' });

    const setToast = (message: string, type: 'success' | 'error' = 'error') => {
        setToastState({ message, show: true, type });
        setTimeout(() => setToastState({ message: '', show: false, type }), 3000);
    };

    useEffect(() => {
        if (!user) return;

        const messagesRef = ref(db, `users/${user.uid}/messages`);
        const notificationsRef = ref(db, `users/${user.uid}/notifications`);

        let firstLoad = true;
        const messagesListener = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            const messageList: Message[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setMessages(messageList.sort((a, b) => b.timestamp - a.timestamp));
            if (firstLoad && messageList.some(m => !m.read)) {
                setShowWelcomeModal(true);
            }
        });
        
        const notificationsListener = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val();
            const notificationList: Notification[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setNotifications(notificationList.sort((a, b) => b.timestamp - a.timestamp));
        });

        setTimeout(() => firstLoad = false, 2000);

        return () => {
            off(messagesRef, 'value', messagesListener);
            off(notificationsRef, 'value', notificationsListener);
        };
    }, [user]);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    
    const unreadMessagesCount = messages.filter(m => !m.read).length;
    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    
    const menuItems = [
        { name: 'Beli Produk', view: 'buy', icon: <IconShoppingBag /> },
        { name: 'Beli Tiket', view: 'buy_ticket', icon: <IconTicket /> },
        { name: 'Mystery Box', view: 'mystery_box', icon: <IconBox /> },
        { name: 'Tiket Saya', view: 'my_tickets', icon: <IconTicket /> },
        { name: 'Riwayat', view: 'history', icon: <IconHistory /> },
        { name: 'Pesan', view: 'messages', icon: <IconMessage />, badge: unreadMessagesCount },
        { name: 'Notifikasi', view: 'notifications', icon: <IconBell />, badge: unreadNotificationsCount },
        { name: 'Tukar Voucher', view: 'redeem_voucher', icon: <IconGift /> },
        { name: 'Profil', view: 'profile', icon: <IconUser /> },
    ];

    const markAsRead = useCallback((type: 'messages' | 'notifications') => {
        if (!user) return;
        const items = type === 'messages' ? messages : notifications;
        const updates: { [key: string]: boolean } = {};
        items.forEach(item => {
            if (!item.read) {
                updates[`/users/${user.uid}/${type}/${item.id}/read`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            update(ref(db), updates);
        }
    }, [user, messages, notifications]);
    
    const handleViewChange = (view: string) => {
        if (view === 'notifications') {
            setNotificationModalOpen(true);
            markAsRead('notifications');
        } else if (view === 'logout') {
            logout();
        } else {
            setActiveView(view);
        }
    };
    
    const mainMenuItems = menuItems.filter(i=>!['notifications'].includes(i.view));

    const renderContent = () => {
        switch (activeView) {
            case 'profile': return <ProfileSection />;
            case 'buy': return <BuySection setToast={msg => setToast(msg, 'error')} />;
            case 'buy_ticket': return <BuyTicketSection setToast={msg => setToast(msg, 'error')} />;
            case 'my_tickets': return <MyTicketsSection />;
            case 'mystery_box': return <MysteryBoxSection />;
            case 'redeem_voucher': return <RedeemVoucherSection />;
            case 'history': return <HistorySection />;
            case 'messages': return <MessagesSection messages={messages} onMarkAsRead={() => markAsRead('messages')} />;
            default: return <BuySection setToast={msg => setToast(msg, 'error')} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Header toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} activeView={activeView} setActiveView={handleViewChange} menuItems={mainMenuItems.filter(i=> i.view !== 'messages')} isLoggedIn={true} onAdminClick={() => {}} />
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} activeView={activeView} setActiveView={handleViewChange} menuItems={[...mainMenuItems, {name: 'Keluar', view: 'logout', icon: <IconLogOut />}]} isLoggedIn={true} onLogout={logout} onAdminClick={() => {}} />
            
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
            
            <Footer />

            <Toast message={toast.message} show={toast.show} type={toast.type} />

            <Modal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} title="Pesan Baru!">
                <p>Anda memiliki pesan yang belum dibaca dari admin. Periksa kotak masuk pesan Anda!</p>
                <button onClick={() => {setShowWelcomeModal(false); setActiveView('messages');}} className="mt-4 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-600 transition-transform active:scale-95">Lihat Pesan</button>
            </Modal>

            <Modal isOpen={isNotificationModalOpen} onClose={() => setNotificationModalOpen(false)} title="Notifikasi">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(notif.timestamp).toLocaleString('id-ID')}</p>
                            <p className="text-gray-800 dark:text-gray-200">{notif.text}</p>
                        </div>
                    )) : <p>Tidak ada notifikasi.</p>}
                </div>
            </Modal>
        </div>
    );
};

export default UserPanel;
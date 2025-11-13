import React, { useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { signOut, updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { IconUser, IconMessage, IconBell, IconShoppingBag, IconBox, IconGift, IconHistory, IconLogOut, IconCheckCircle, IconXCircle, IconWhatsApp } from '../constants';
import { Message, Notification, Product, PurchaseHistoryItem, MysteryBoxState } from '../types';
// Fix: Import the 'set' function to write data to Firebase Realtime Database.
import { ref, onValue, off, update, push, serverTimestamp, set } from 'firebase/database';
import Modal from '../components/Modal';
import { Spinner } from '../components/Spinner';

// Helper to get a consistent "random" image for a product
const getProductImage = (productName: string) => `https://picsum.photos/seed/${productName.replace(/\s/g, '')}/400/300`;

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
        if (!user || !currentPassword) {
            setMessage("Current password is required to make changes.");
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            if (newEmail && newEmail !== user.email) {
                await updateEmail(user, newEmail);
                // Also update in DB
                const userDbRef = ref(db, `users/${user.uid}/email`);
                await update(ref(db), { [`users/${user.uid}/email`]: newEmail });
                setMessage("Email updated successfully.");
            }
            if (newPassword) {
                await updatePassword(user, newPassword);
                setMessage(prev => prev + " Password updated successfully.");
            }
            if (!newEmail && !newPassword) {
                setMessage("No changes were made.");
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
            <h2 className="text-2xl font-bold mb-4">Profile Management</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">New Email</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Current Password (Required)</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                {message && <p className="text-sm text-center text-indigo-500">{message}</p>}
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? <Spinner /> : "Update Profile"}
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
            setToast("Sorry, this item is not available.");
            return;
        }

        const pendingOrdersRef = ref(db, 'pendingOrders');
        const newOrderRef = push(pendingOrdersRef);
        set(newOrderRef, {
            userId: user.uid,
            userEmail: user.email,
            type: 'product',
            productName: product.name,
            productId: product.id,
            price: product.price,
            timestamp: serverTimestamp()
        });
        
        window.open('https://lynk.id/yustdan', '_blank');
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Products For Sale</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(product => (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <img src={getProductImage(product.name)} alt={product.name} className="w-full h-56 object-cover" />
                        <div className="p-6">
                            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 h-20 overflow-hidden">{product.description}</p>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-lg font-bold text-indigo-500">Rp {product.price.toLocaleString()}</p>
                                <p className="text-sm font-medium">{product.isAvailable && product.stock > 0 ? `${product.stock} in stock` : 'Unavailable'}</p>
                            </div>
                            <button 
                                onClick={() => handleBuy(product)} 
                                disabled={!product.isAvailable || product.stock <= 0}
                                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Buy Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MysteryBoxSection: React.FC = () => {
    const { user, userProfile } = useAuth();
    const [boxState, setBoxState] = useState<MysteryBoxState | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [winResult, setWinResult] = useState(false);
    const [voucher, setVoucher] = useState('');
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(sessionStorage.getItem('mysteryBoxPurchase') === 'true');

    useEffect(() => {
        if (!user) return;
        const boxStateRef = ref(db, `users/${user.uid}/mysteryBoxState`);
        const listener = onValue(boxStateRef, (snapshot) => {
            setBoxState(snapshot.val());
        });
        return () => off(boxStateRef, 'value', listener);
    }, [user]);

    const handleBuyBox = () => {
        if (!user) return;
        const pendingOrdersRef = ref(db, 'pendingOrders');
        const newOrderRef = push(pendingOrdersRef);
        set(newOrderRef, {
            userId: user.uid,
            userEmail: user.email,
            type: 'mystery_box',
            price: 50000, // Example price
            timestamp: serverTimestamp()
        });
        sessionStorage.setItem('mysteryBoxPurchase', 'true');
        window.open('http://lynk.id/yustdan/gmz9dn1dk1ek/checkout', '_blank');
        setShowPaymentPrompt(true);
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
            <h2 className="text-3xl font-bold mb-4">Mystery Box Challenge</h2>
            <IconBox />
            <p className="my-4">Test your luck! Purchase a Mystery Box for a chance to win an exclusive voucher.</p>
            {showPaymentPrompt && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 my-4 text-left">
                    <p className="font-bold">Action Required</p>
                    <p>Please send your proof of payment to our admin via WhatsApp.</p>
                    <a href="https://wa.me/6285817938860" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                        <IconWhatsApp /> Kirim Bukti
                    </a>
                </div>
            )}
            <div className="my-6">
                <button onClick={handleBuyBox} className="bg-yellow-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-yellow-600 transition">
                    Buy Mystery Box (Rp 50,000)
                </button>
            </div>
            <div className="my-6">
                <button 
                    onClick={handleOpenBox} 
                    disabled={!boxState?.canOpen}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {boxState?.canOpen ? 'Open Your Box!' : 'Waiting for Admin Confirmation'}
                </button>
            </div>
            <p className="text-lg">Total Plays: <span className="font-bold">{userProfile?.mysteryBoxPlays || 0}</span></p>

            <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Mystery Box Result">
                <div className="text-center">
                    {winResult ? (
                        <>
                            <IconCheckCircle />
                            <h3 className="text-2xl font-bold text-green-500 mt-4">Congratulations, You Won!</h3>
                            <p className="my-2">Screenshot this voucher code and send it to the admin to claim your prize!</p>
                            <p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-lg tracking-widest">{voucher}</p>
                        </>
                    ) : (
                         <>
                            <IconXCircle />
                            <h3 className="text-2xl font-bold text-red-500 mt-4">Better Luck Next Time!</h3>
                            <p className="my-2">Unfortunately, you didn't win this time. Don't give up!</p>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

const RedeemVoucherSection: React.FC = () => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">How to Redeem Your Voucher</h2>
        <IconGift />
        <p className="my-4">If you won a voucher from the Mystery Box, congratulations!</p>
        <p>To redeem your prize, please send the screenshot of your voucher code to our admin on WhatsApp.</p>
        <a href="https://wa.me/6285817938860" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-lg">
            <IconWhatsApp /> Contact Admin Now
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
            <h2 className="text-2xl font-bold mb-4">Purchase History</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left py-2">Item</th>
                            <th className="text-left py-2">Type</th>
                            <th className="text-left py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length > 0 ? history.map(item => (
                            <tr key={item.id} className="border-b dark:border-gray-700">
                                <td className="py-2">{item.name}</td>
                                <td className="py-2 capitalize">{item.type.replace('_', ' ')}</td>
                                <td className="py-2">{new Date(item.timestamp).toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} className="text-center py-4">No purchase history.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const UserPanel: React.FC = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('buy');
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isMessageModalOpen, setMessageModalOpen] = useState(false);
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
            if (!firstLoad && messageList.some(m => !m.read)) {
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
    
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    };

    const unreadMessagesCount = messages.filter(m => !m.read).length;
    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    
    const menuItems = [
        { name: 'Buy Products', view: 'buy', icon: <IconShoppingBag /> },
        { name: 'Mystery Box', view: 'mystery_box', icon: <IconBox /> },
        { name: 'History', view: 'history', icon: <IconHistory /> },
        { name: 'Messages', view: 'messages', icon: <IconMessage />, badge: unreadMessagesCount },
        { name: 'Notifications', view: 'notifications', icon: <IconBell />, badge: unreadNotificationsCount },
        { name: 'Redeem Voucher', view: 'redeem_voucher', icon: <IconGift /> },
        { name: 'Profile', view: 'profile', icon: <IconUser /> },
    ];

    const markAsRead = (type: 'messages' | 'notifications') => {
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
    };
    
    const handleViewChange = (view: string) => {
        if (view === 'messages') {
            setMessageModalOpen(true);
            markAsRead('messages');
        } else if (view === 'notifications') {
            setNotificationModalOpen(true);
            markAsRead('notifications');
        } else {
            setActiveView(view);
        }
    };

    const renderContent = () => {
        switch (activeView) {
            case 'profile': return <ProfileSection />;
            case 'buy': return <BuySection setToast={msg => setToast(msg, 'error')} />;
            case 'mystery_box': return <MysteryBoxSection />;
            case 'redeem_voucher': return <RedeemVoucherSection />;
            case 'history': return <HistorySection />;
            default: return <BuySection setToast={msg => setToast(msg, 'error')} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Header toggleSidebar={toggleSidebar} activeView={activeView} setActiveView={handleViewChange} menuItems={menuItems.filter(i=>!['messages','notifications'].includes(i.view))} isLoggedIn={true} />
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} activeView={activeView} setActiveView={handleViewChange} menuItems={[...menuItems, {name: 'Logout', view: 'logout', icon: <IconLogOut />}]} isLoggedIn={true} onLogout={handleLogout} />
            
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>

            <Toast message={toast.message} show={toast.show} type={toast.type} />

            <Modal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} title="New Message!">
                <p>You have unread messages from the admin. Check your message box!</p>
                <button onClick={() => {setShowWelcomeModal(false); setMessageModalOpen(true); markAsRead('messages');}} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">View Messages</button>
            </Modal>
            
            <Modal isOpen={isMessageModalOpen} onClose={() => setMessageModalOpen(false)} title="Messages">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.length > 0 ? messages.map(msg => (
                        <div key={msg.id} className={`p-3 rounded-lg ${msg.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900'}`}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(msg.timestamp).toLocaleString()}</p>
                            <p className="text-gray-800 dark:text-gray-200">{msg.text}</p>
                        </div>
                    )) : <p>No messages.</p>}
                </div>
            </Modal>

            <Modal isOpen={isNotificationModalOpen} onClose={() => setNotificationModalOpen(false)} title="Notifications">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900'}`}>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(notif.timestamp).toLocaleString()}</p>
                            <p className="text-gray-800 dark:text-gray-200">{notif.text}</p>
                        </div>
                    )) : <p>No notifications.</p>}
                </div>
            </Modal>
        </div>
    );
};

export default UserPanel;

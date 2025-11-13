
import React, { useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { ref, onValue, off, set, update, remove, push, serverTimestamp, get, query, orderByChild, equalTo } from 'firebase/database';
import { IconShoppingBag, IconUsers, IconClipboard, IconSettings, IconLogOut, IconPlusCircle } from '../constants';
import { Product, UserProfile, PendingOrder, PurchaseHistoryItem } from '../types';
import { Spinner } from '../components/Spinner';
import Modal from '../components/Modal';

// Helper to get a consistent "random" image for a product
const getProductImage = (productName: string) => `https://picsum.photos/seed/${productName.replace(/\s/g, '')}/400/300`;

// --- SECTIONS ---

const ProductManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, stock: 0 });

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
        await set(newProductRef, { ...newProduct, isAvailable: true });
        setNewProduct({ name: '', description: '', price: 0, stock: 0 });
        setModalOpen(false);
    };

    const handleUpdate = (id: string, field: keyof Product, value: any) => {
        const productRef = ref(db, `products/${id}/${field}`);
        set(productRef, value);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            const productRef = ref(db, `products/${id}`);
            remove(productRef);
        }
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;
    
    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Manage Products</h2>
                <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <IconPlusCircle /> Add Product
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                         <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Image</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Stock</th>
                            <th className="text-left p-2">Price</th>
                            <th className="text-left p-2">Available</th>
                            <th className="text-left p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b dark:border-gray-700">
                                <td className="p-2"><img src={getProductImage(p.name)} alt={p.name} className="w-16 h-12 object-cover rounded"/></td>
                                <td className="p-2">{p.name}</td>
                                <td className="p-2"><input type="number" value={p.stock} onChange={e => handleUpdate(p.id, 'stock', Number(e.target.value))} className="w-20 p-1 border rounded dark:bg-gray-700"/></td>
                                <td className="p-2"><input type="number" value={p.price} onChange={e => handleUpdate(p.id, 'price', Number(e.target.value))} className="w-24 p-1 border rounded dark:bg-gray-700"/></td>
                                <td className="p-2"><input type="checkbox" checked={p.isAvailable} onChange={e => handleUpdate(p.id, 'isAvailable', e.target.checked)} className="h-5 w-5"/></td>
                                <td className="p-2"><button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add New Product">
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <input type="text" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} required className="w-full p-2 border rounded dark:bg-gray-700"></textarea>
                    <input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} required className="w-full p-2 border rounded dark:bg-gray-700"/>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Add Product</button>
                </form>
            </Modal>
        </div>
    );
};

const UserManagement = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

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
        sendPasswordResetEmail(auth, email)
            .then(() => alert(`Password reset email sent to ${email}`))
            .catch(error => alert(`Error: ${error.message}`));
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Manage Users ({users.length})</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Total Spent</th>
                             <th className="text-left p-2">MB Plays</th>
                            <th className="text-left p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.uid} className="border-b dark:border-gray-700">
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">Rp {(u.totalSpent || 0).toLocaleString()}</td>
                                <td className="p-2">{u.mysteryBoxPlays || 0}</td>
                                <td className="p-2"><button onClick={() => handlePasswordReset(u.email)} className="text-indigo-500 hover:underline">Reset Password</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
        const price = order.type === 'mystery_box' ? 50000 : (await get(ref(db, `products/${(order as any).productId}/price`))).val();

        // 1. Add to purchase history
        updates[`/users/${order.userId}/purchaseHistory/${order.id}`] = {
            name: order.productName || 'Mystery Box',
            type: order.type,
            price,
            timestamp
        };
        
        // 2. Send message & notification
        const messageId = push(ref(db, `users/${order.userId}/messages`)).key;
        const notifId = push(ref(db, `users/${order.userId}/notifications`)).key;
        updates[`/users/${order.userId}/messages/${messageId}`] = { text: `Your order for ${order.productName || 'Mystery Box'} has been confirmed!`, read: false, timestamp };
        updates[`/users/${order.userId}/notifications/${notifId}`] = { text: `Purchase successful: ${order.productName || 'Mystery Box'}.`, read: false, timestamp };

        // 3. Update user total spent
        updates[`/users/${order.userId}/totalSpent`] = (userProfile.totalSpent || 0) + price;
        
        // 4. Handle item-specific logic
        if (order.type === 'product') {
            const productRef = ref(db, `products/${(order as any).productId}`);
            const productSnap = await get(productRef);
            const product = productSnap.val();
            updates[`/products/${(order as any).productId}/stock`] = product.stock - 1;
        } else { // Mystery Box
            updates[`/users/${order.userId}/mysteryBoxState/canOpen`] = true;
        }

        // 5. Remove from pending
        updates[`/pendingOrders/${order.id}`] = null;

        await update(ref(db), updates);
        alert('Order confirmed!');
    };
    
    const handleReject = async (order: PendingOrder) => {
        const updates: { [key: string]: any } = {};
        const notifId = push(ref(db, `users/${order.userId}/notifications`)).key;
        updates[`/users/${order.userId}/notifications/${notifId}`] = { text: `Your purchase for ${order.productName || 'Mystery Box'} was declined.`, read: false, timestamp: Date.now() };
        updates[`/pendingOrders/${order.id}`] = null;
        await update(ref(db), updates);
        alert('Order rejected!');
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Confirm Orders ({orders.length})</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Item</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{o.userEmail}</td>
                                <td className="p-2">{o.productName || 'Mystery Box'}</td>
                                <td className="p-2 capitalize">{o.type.replace('_',' ')}</td>
                                <td className="p-2">{new Date(o.timestamp).toLocaleString()}</td>
                                <td className="p-2 space-x-2">
                                    <button onClick={() => handleConfirm(o)} className="bg-green-500 text-white px-3 py-1 rounded">Confirm</button>
                                    <button onClick={() => handleReject(o)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
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
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const usersRef = ref(db, 'users');
        const listener = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const userList: UserProfile[] = [];
            for (const uid in data) {
                // Query for pending mystery box orders for this user
                const pendingOrdersRef = query(ref(db, 'pendingOrders'), orderByChild('userId'), equalTo(uid));
                get(pendingOrdersRef).then(orderSnapshot => {
                    let hasPendingMB = false;
                    orderSnapshot.forEach(child => {
                        if (child.val().type === 'mystery_box') {
                            hasPendingMB = true;
                        }
                    });
                     // Only show users with pending MB orders or who have played before
                    if (hasPendingMB || data[uid].mysteryBoxPlays > 0) {
                         userList.push({ uid, ...data[uid] });
                    }
                })
            }
            // This is async, so UI might flicker. A better way would be a backend process.
            setTimeout(() => {
                 setUsers(userList);
                 setLoading(false);
            }, 1000); // give time for async gets to finish
        });
        return () => off(usersRef, 'value', listener);
    }, []);

    const handleStateChange = (uid: string, field: 'canOpen' | 'willWin', value: boolean) => {
        const stateRef = ref(db, `users/${uid}/mysteryBoxState/${field}`);
        set(stateRef, value);
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Manage Mystery Box</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Enable Play</th>
                            <th className="text-left p-2">Set as Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.uid} className="border-b dark:border-gray-700">
                                <td className="p-2">{u.email}</td>
                                <td className="p-2"><input type="checkbox" onChange={e => handleStateChange(u.uid, 'canOpen', e.target.checked)} className="h-5 w-5"/></td>
                                <td className="p-2"><input type="checkbox" onChange={e => handleStateChange(u.uid, 'willWin', e.target.checked)} className="h-5 w-5"/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Reports = () => {
    const [allHistory, setAllHistory] = useState<(PurchaseHistoryItem & {userEmail: string})[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const usersRef = ref(db, 'users');
        const listener = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            const historyList: (PurchaseHistoryItem & {userEmail: string})[] = [];
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
            setAllHistory(historyList.sort((a,b) => b.timestamp - a.timestamp));
            setLoading(false);
        });
        return () => off(usersRef, 'value', listener);
    }, []);

     if (loading) return <div className="flex justify-center"><Spinner /></div>;

    const totalRevenue = allHistory.reduce((acc, item) => acc + (item.price || 0), 0);
    
    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Sales Reports</h2>
            <p className="mb-4 font-semibold text-lg">Total Revenue: Rp {totalRevenue.toLocaleString()}</p>
             <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                         <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Item</th>
                            <th className="text-left p-2">Price</th>
                            <th className="text-left p-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allHistory.map(h => (
                            <tr key={h.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{h.userEmail}</td>
                                <td className="p-2">{h.name}</td>
                                <td className="p-2">Rp {h.price.toLocaleString()}</td>
                                <td className="p-2">{new Date(h.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('orders');

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev);
    }, []);
    
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    };

    const menuItems = [
        { name: 'Confirm Orders', view: 'orders', icon: <IconClipboard /> },
        { name: 'Manage Products', view: 'products', icon: <IconShoppingBag /> },
        { name: 'Manage Users', view: 'users', icon: <IconUsers /> },
        { name: 'Manage Mystery Box', view: 'mystery_box', icon: <IconSettings /> },
        { name: 'Reports', view: 'reports', icon: <IconClipboard /> },
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'products': return <ProductManagement />;
            case 'users': return <UserManagement />;
            case 'orders': return <OrderConfirmation />;
            case 'mystery_box': return <MysteryBoxManagement />;
            case 'reports': return <Reports />;
            default: return <OrderConfirmation />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Header toggleSidebar={toggleSidebar} activeView={activeView} setActiveView={setActiveView} menuItems={menuItems} isLoggedIn={true} />
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} activeView={activeView} setActiveView={setActiveView} menuItems={[...menuItems, {name: 'Logout', view: 'logout', icon: <IconLogOut />}]} isLoggedIn={true} onLogout={handleLogout} />
            
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminPanel;

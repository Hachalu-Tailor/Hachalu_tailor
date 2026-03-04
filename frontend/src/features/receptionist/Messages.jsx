import React, { useState, useEffect } from 'react';
import {
    HiOutlineChatBubbleLeftRight,
    HiOutlinePaperAirplane,
    HiOutlineUser,
    HiOutlineMagnifyingGlass,
    HiOutlineEllipsisVertical,
    HiOutlinePhone,
    HiOutlineVideoCamera,
    HiOutlineUsers,
    HiOutlineArrowRight
} from 'react-icons/hi2';
import { useApi } from '../../hooks/useApi';
import { getGarmentStaff, getReceptionStaff } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

const Messages = () => {
    const { user } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [messagesList, setMessagesList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all'); // all, garment, receptionist

    // Get current user role
    const currentRole = user?.role || user?.user_type;

    useEffect(() => {
        fetchStaff();
    }, [filterRole]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            let response;
            if (filterRole === 'garment') {
                response = await getGarmentStaff();
            } else if (filterRole === 'receptionist') {
                response = await getReceptionStaff();
            } else {
                // Get all staff
                response = await useApi('/accounts/admin/staff/');
            }
            
            // Handle paginated response
            let data = response.data;
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                data = data.results || data.data || data.items || [];
            }
            
            // Filter out current user from list
            const filteredStaff = (data || []).filter(staff => staff.id !== user?.id);
            setStaffList(filteredStaff.map(staff => ({
                id: staff.id,
                name: staff.name || staff.username || 'Unknown',
                role: staff.role || staff.user_type || 'Staff',
                online: Math.random() > 0.5 // Mock - in real app would come from backend
            })));
        } catch (error) {
            console.error('Error fetching staff:', error);
            // Fallback to mock data if API fails
            setStaffList([
                { id: 1, name: 'John Tailor', role: 'GARMENT', online: true },
                { id: 2, name: 'Sarah Designer', role: 'GARMENT', online: true },
                { id: 3, name: 'Mike Cutter', role: 'GARMENT', online: false },
                { id: 4, name: 'Emma Stitcher', role: 'GARMENT', online: true },
                { id: 5, name: 'Reception Desk', role: 'RECEPTIONIST', online: true },
                { id: 6, name: 'Front Desk', role: 'RECEPTIONIST', online: true },
            ].filter(staff => {
                // Filter based on role selection
                if (filterRole === 'garment') return staff.role === 'GARMENT';
                if (filterRole === 'receptionist') return staff.role === 'RECEPTIONIST';
                return staff.role !== currentRole; // Exclude current user's role
            }));
        } finally {
            setLoading(false);
        }
    };

    // Mock messages for demonstration
    const mockMessages = [
        { id: 1, from: 1, text: 'The suit measurements are ready for review', time: '10:30 AM' },
        { id: 2, from: 'me', text: 'Great! I\'ll check them now', time: '10:32 AM' },
        { id: 3, from: 1, text: 'Also, we need more navy blue fabric', time: '10:35 AM' },
    ];

    useEffect(() => {
        if (selectedChat) {
            setMessagesList(mockMessages);
        }
    }, [selectedChat]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage = {
            id: Date.now(),
            from: 'me',
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessagesList([...messagesList, newMessage]);
        setMessage('');
    };

    const filteredStaff = staffList.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get role display name
    const getRoleDisplay = (role) => {
        const roleNames = {
            'GARMENT': 'Tailor',
            'RECEPTIONIST': 'Reception',
            'ADMIN': 'Admin'
        };
        return roleNames[role] || role;
    };

    // Get role badge color
    const getRoleBadgeColor = (role) => {
        const colors = {
            'GARMENT': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            'RECEPTIONIST': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'ADMIN': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
        };
        return colors[role] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6">
            {/* Staff List Sidebar */}
            <div className="w-80 bg-white dark:bg-[#080808] border border-gray-100 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-600 rounded-2xl text-white">
                            <HiOutlineChatBubbleLeftRight size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black dark:text-white uppercase italic">Messages</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Staff Communication
                            </p>
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                        <button
                            onClick={() => setFilterRole('all')}
                            className={`flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                filterRole === 'all' ? 'bg-white dark:bg-white/10 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterRole('garment')}
                            className={`flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                filterRole === 'garment' ? 'bg-white dark:bg-white/10 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            Tailors
                        </button>
                        <button
                            onClick={() => setFilterRole('receptionist')}
                            className={`flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                filterRole === 'receptionist' ? 'bg-white dark:bg-white/10 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            Reception
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-0 rounded-2xl text-sm dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600/20"
                        />
                    </div>
                </div>

                {/* Staff List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="text-center py-8">
                            <HiOutlineUsers className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-sm text-gray-400">No staff found</p>
                        </div>
                    ) : (
                        filteredStaff.map((staff) => (
                            <button
                                key={staff.id}
                                onClick={() => setSelectedChat(staff)}
                                className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${
                                    selectedChat?.id === staff.id
                                        ? 'bg-red-600 text-white'
                                        : 'hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white'
                                }`}
                            >
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                        selectedChat?.id === staff.id
                                            ? 'bg-white/20'
                                            : 'bg-gray-100 dark:bg-white/5'
                                    }`}>
                                        <HiOutlineUser size={24} />
                                    </div>
                                    {staff.online && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#080808]" />
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-[10px] font-black uppercase tracking-wider">{staff.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            selectedChat?.id === staff.id ? 'bg-white/20 text-white' : getRoleBadgeColor(staff.role)
                                        }`}>
                                            {getRoleDisplay(staff.role)}
                                        </span>
                                    </div>
                                </div>
                                {staff.role !== currentRole && (
                                    <div className={`text-[8px] ${selectedChat?.id === staff.id ? 'text-white/60' : 'text-gray-400'}`}>
                                        {staff.role === 'GARMENT' ? '👔' : '🖥️'}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-[#080808] border border-gray-100 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                                        <HiOutlineUser size={24} className="dark:text-white" />
                                    </div>
                                    {selectedChat.online && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#080808]" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black dark:text-white uppercase">{selectedChat.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${getRoleBadgeColor(selectedChat.role)}`}>
                                            {getRoleDisplay(selectedChat.role)}
                                        </span>
                                        {selectedChat.role !== currentRole && (
                                            <span className="text-[8px] text-green-500 flex items-center gap-1">
                                                <HiOutlineArrowRight size={10} />
                                                {currentRole === 'GARMENT' ? 'Reception' : 'Tailor'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                                    <HiOutlinePhone className="dark:text-white" size={20} />
                                </button>
                                <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                                    <HiOutlineVideoCamera className="dark:text-white" size={20} />
                                </button>
                                <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                                    <HiOutlineEllipsisVertical className="dark:text-white" size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messagesList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <HiOutlineChatBubbleLeftRight size={32} className="text-gray-300 dark:text-white/20" />
                                    </div>
                                    <h4 className="text-sm font-bold dark:text-white mb-1">Start a conversation</h4>
                                    <p className="text-xs text-gray-400 max-w-md">
                                        Send a message to {selectedChat.name} about orders, materials, or any updates.
                                    </p>
                                </div>
                            ) : (
                                messagesList.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-md p-4 rounded-3xl ${
                                                msg.from === 'me'
                                                    ? 'bg-red-600 text-white rounded-br-md'
                                                    : 'bg-gray-100 dark:bg-white/5 dark:text-white rounded-bl-md'
                                            }`}
                                        >
                                            <p className="text-sm font-medium">{msg.text}</p>
                                            <p className={`text-[9px] mt-2 ${msg.from === 'me' ? 'text-white/70' : 'text-gray-400'
                                                }`}>
                                                {msg.time}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={`Message ${selectedChat.name}...`}
                                    className="flex-1 px-6 py-4 bg-gray-50 dark:bg-white/5 border-0 rounded-3xl text-sm dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600/20"
                                />
                                <button
                                    type="submit"
                                    className="p-4 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/30"
                                >
                                    <HiOutlinePaperAirplane size={24} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <HiOutlineChatBubbleLeftRight size={48} className="text-gray-300 dark:text-white/20" />
                        </div>
                        <h3 className="text-lg font-black dark:text-white uppercase mb-2">Select a Conversation</h3>
                        <p className="text-sm text-gray-400 max-w-md">
                            Choose a {currentRole === 'GARMENT' ? 'receptionist' : 'tailor'} from the list to start or continue a conversation about orders and updates.
                        </p>
                        
                        {/* Quick Contact Suggestion */}
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl max-w-md">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Quick Contact
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {currentRole === 'GARMENT' 
                                    ? 'Need to confirm an order status? Message the reception desk directly.'
                                    : 'Need updates on garment progress? Message the tailor workshop.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;

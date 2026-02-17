import React, { useState, useEffect } from 'react';
import {
    HiOutlineChatBubbleLeftRight,
    HiOutlinePaperAirplane,
    HiOutlineUser,
    HiOutlineMagnifyingGlass,
    HiOutlineEllipsisVertical,
    HiOutlinePhone,
    HiOutlineVideoCamera
} from 'react-icons/hi2';
import { useApi } from '../../hooks/useApi';

const Messages = () => {
    const { data: staffData, loading } = useApi('/accounts/staff/');
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [messagesList, setMessagesList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock initial data - in production this would come from API
    const mockStaff = [
        { id: 1, name: 'John Tailor', role: 'Tailor', online: true },
        { id: 2, name: 'Sarah Designer', role: 'Designer', online: true },
        { id: 3, name: 'Mike Cutter', role: 'Cutter', online: false },
        { id: 4, name: 'Emma Stitcher', role: 'Stitcher', online: true },
    ];

    const mockMessages = [
        { id: 1, from: 1, text: 'The suit measurements are ready for review', time: '10:30 AM' },
        { id: 2, from: 'me', text: 'Great! I\'ll check them now', time: '10:32 AM' },
        { id: 3, from: 1, text: 'Also, we need more navy blue fabric', time: '10:35 AM' },
    ];

    useEffect(() => {
        setMessagesList(mockMessages);
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

    const filteredStaff = mockStaff.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    {filteredStaff.map((staff) => (
                        <button
                            key={staff.id}
                            onClick={() => setSelectedChat(staff)}
                            className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${selectedChat?.id === staff.id
                                ? 'bg-red-600 text-white'
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white'
                                }`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedChat?.id === staff.id
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
                                <p className={`text-[9px] ${selectedChat?.id === staff.id ? 'text-white/70' : 'text-gray-400'}`}>
                                    {staff.role}
                                </p>
                            </div>
                        </button>
                    ))}
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
                                    <p className="text-[10px] text-gray-400 uppercase">{selectedChat.role}</p>
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
                            {messagesList.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-md p-4 rounded-3xl ${msg.from === 'me'
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
                            ))}
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message..."
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
                            Choose a staff member from the list to start or continue a conversation
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;

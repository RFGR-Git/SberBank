import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { COLORS } from '../../constants';

const MessagePopup = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose(); // Call onClose to clear message in parent state
            }, 3000); // Message visible for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!isVisible) return null;

    let bgColor = COLORS.info; // Default to info background color
    let icon = <Info size={24} />;
    let textColor = COLORS.typography; // Default text color

    switch (type) {
        case 'success':
            bgColor = COLORS.success;
            icon = <CheckCircle size={24} />;
            textColor = 'white'; // Assuming success color needs white text for contrast
            break;
        case 'error':
            bgColor = COLORS.danger;
            icon = <XCircle size={24} />;
            textColor = 'white'; // Assuming danger color needs white text for contrast
            break;
        case 'warning':
            bgColor = COLORS.warning;
            icon = <AlertTriangle size={24} />;
            textColor = 'white'; // Assuming warning color needs white text for contrast
            break;
        case 'info':
        default:
            bgColor = COLORS.info;
            icon = <Info size={24} />;
            textColor = 'white'; // Assuming info color needs white text for contrast
            break;
    }

    return (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl flex items-center space-x-3 z-50 transform transition-transform duration-300 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`} style={{ backgroundColor: bgColor, color: textColor }}>
            {icon}
            <p className="font-semibold">{message}</p>
            <button onClick={() => { setIsVisible(false); onClose(); }} className="ml-auto text-white opacity-75 hover:opacity-100">
                <XCircle size={20} />
            </button>
        </div>
    );
};

export default MessagePopup;

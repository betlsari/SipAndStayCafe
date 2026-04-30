import { useEffect } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';

interface UseCashierHubProps {
    onTableWaitingForPayment: (data: { tableNumber: number; totalAmount: number }) => void;
    onTableSessionClosed: (tableNumber: number) => void;
}

export const useCashierHub = ({
    onTableWaitingForPayment,
    onTableSessionClosed,
}: UseCashierHubProps) => {

    useEffect(() => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        let connection: HubConnection;

        const startConnection = async () => {
            connection = new HubConnectionBuilder()
                .withUrl(`${import.meta.env.VITE_API_URL}/hubs/cashier`, {
                    accessTokenFactory: () => token,
                })
                .configureLogging(LogLevel.Information)
                .withAutomaticReconnect()
                .build();

            // Handler'larý doðrudan connection üzerine baðlýyoruz
            connection.on('ReceiveTableWaitingForPayment', (data: { tableNumber: number; totalAmount: number }) => {
                console.log('SignalR: ReceiveTableWaitingForPayment', data);
                onTableWaitingForPayment(data);
            });

            connection.on('ReceiveTableSessionClosed', (tableNumber: number) => {
                console.log('SignalR: ReceiveTableSessionClosed', tableNumber);
                onTableSessionClosed(tableNumber);
            });

            try {
                await connection.start();
                console.log('SignalR Connected (CashierHub)');
            } catch (err) {
                console.error('SignalR Connection Error (CashierHub): ', err);
                setTimeout(startConnection, 5000);
            }
        };

        startConnection();

        return () => {
            if (connection) {
                connection.off('ReceiveTableWaitingForPayment');
                connection.off('ReceiveTableSessionClosed');
                connection.stop().then(() => console.log('SignalR Disconnected (CashierHub)'));
            }
        };
    }, [onTableWaitingForPayment, onTableSessionClosed]); // Baðýmlýlýklarý ekledik
};
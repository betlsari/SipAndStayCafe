import { Outlet } from 'react-router-dom'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminLayout() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', fontFamily: 'var(--font)' }}>
            <AdminNav />
            <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px' }}>
                <Outlet />
            </main>
        </div>
    )
}
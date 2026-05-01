import { Outlet } from 'react-router-dom'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            <AdminNav />
            <main className="flex-1 min-w-0 pb-20 lg:pb-0">
                <Outlet />
            </main>
        </div>
    )
}
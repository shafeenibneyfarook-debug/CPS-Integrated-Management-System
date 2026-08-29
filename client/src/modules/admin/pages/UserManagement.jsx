import { useEffect, useState } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../../auth/authStore";
import formatError from "../../../utils/formatError";
import "../../auth/auth.css";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const { user: currentUser } = useAuth();

    useEffect(() => {
        let active = true;
        API.get("/admin/users")
            .then(({ data }) => {
                if (active) {
                    setUsers(Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []));
                }
            })
            .catch((requestError) => {
                if (active) setError(formatError(requestError, "Unable to load users"));
            });
        return () => { active = false; };
    }, []);

    const update = async (id, changes) => {
        setError("");
        try {
            const { data } = await API.patch(`/admin/users/${id}`, changes);
            setUsers((items) => items.map((item) => item._id === id ? data.user : item));
        } catch (requestError) {
            setError(formatError(requestError, "Unable to update access"));
        }
    };

    return (
        <div className="settings-page user-management">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h1>Users & Role Access Control</h1>
                    <p>Assign responsibilities and manage workspace permissions for all users.</p>
                </div>
                <span className="user-count">{users.length} users</span>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="user-table-wrap">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Contact Info</th>
                            <th>Assigned Role</th>
                            <th>Account Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((userItem) => (
                            <tr key={userItem._id}>
                                <td>
                                    <strong>{userItem.name}</strong>
                                    {userItem._id === currentUser?._id && <small style={{ marginLeft: "6px", color: "#2563eb", fontWeight: "700" }}>You</small>}
                                </td>
                                <td>
                                    {userItem.email}
                                    <br />
                                    <small>{userItem.phone}</small>
                                </td>
                                <td>
                                    <select
                                        value={userItem.role}
                                        disabled={userItem._id === currentUser?._id}
                                        onChange={(e) => update(userItem._id, { role: e.target.value })}
                                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="client">Client / Customer</option>
                                        <option value="supplier">Supplier / Material Vendor</option>
                                        <option value="operations_officer">Operations Officer</option>
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="accounts_officer">Accounts Officer</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </td>
                                <td>
                                    <button
                                        className={userItem.isActive ? "status-active" : "status-inactive"}
                                        disabled={userItem._id === currentUser?._id}
                                        onClick={() => update(userItem._id, { isActive: !userItem.isActive })}
                                    >
                                        {userItem.isActive ? "Active" : "Inactive"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

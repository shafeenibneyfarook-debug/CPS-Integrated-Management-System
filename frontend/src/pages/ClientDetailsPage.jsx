import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TanmayLayout from '../layouts/TanmayLayout';
import { clientService } from '../services/clientService';

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const response = await clientService.get(id);
        setClient(response.data?.data || null);
      } catch (error) {
        console.error(error);
      }
    };
    loadClient();
  }, [id]);

  if (!client) return null;
  return (
    <TanmayLayout activeLabel="Clients">
      <div className="p-8">
        <h1 className="text-2xl font-extrabold">Client Details</h1>
        <div className="mt-6 rounded bg-neutral-200 p-6">
          <p><strong>Company:</strong> {client.company_name}</p>
          <p><strong>Contact Person:</strong> {client.contact_person}</p>
          <p><strong>Phone:</strong> {client.phone}</p>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Client Type:</strong> {client.client_type}</p>
          <p><strong>Status:</strong> {client.status}</p>
          <p><strong>Address:</strong> {client.address}</p>
          {client.latitude || client.longitude ? <p><strong>Location:</strong> {client.latitude}, {client.longitude}</p> : null}
          <div className="mt-4 rounded border border-slate-300 bg-white/80 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Related details & specifications</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{client.note || 'No additional specifications provided.'}</p>
          </div>
        </div>
        <button onClick={() => navigate('/tanmay/clients')} className="primary-btn mt-6">Back to list</button>
      </div>
    </TanmayLayout>
  );
}

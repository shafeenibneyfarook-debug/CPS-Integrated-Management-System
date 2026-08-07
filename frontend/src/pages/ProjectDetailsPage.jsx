import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AminLayout from '../layouts/AminLayout';
import { projectService } from '../services/projectService';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await projectService.get(id);
        setProject(response.data?.data || null);
      } catch (error) {
        console.error(error);
      }
    };
    loadProject();
  }, [id]);

  if (!project) return null;
  return (
    <AminLayout activeLabel="Projects">
      <div className="p-8">
        <h1 className="text-2xl font-extrabold">Project Details</h1>
        <div className="mt-6 rounded bg-neutral-200 p-6">
          <p><strong>Name:</strong> {project.project_name}</p>
          <p><strong>Client:</strong> {project.client_name || project.client_id}</p>
          <p><strong>Start Date:</strong> {formatDate(project.start_date)}</p>
          <p><strong>Deadline:</strong> {formatDate(project.deadline)}</p>
          <p><strong>Budget:</strong> {formatCurrency(project.budget)}</p>
          <p><strong>Status:</strong> {project.status}</p>
          <p><strong>Location:</strong> {project.location_name || '—'}</p>
          <p><strong>Latitude:</strong> {project.latitude || '—'}</p>
          <p><strong>Longitude:</strong> {project.longitude || '—'}</p>
          <p><strong>Description:</strong> {project.description || '—'}</p>
        </div>
        <button onClick={() => navigate('/amin/projects')} className="primary-btn mt-6">Back to list</button>
      </div>
    </AminLayout>
  );
}

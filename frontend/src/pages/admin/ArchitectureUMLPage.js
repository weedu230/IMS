import React, { useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import { architectureAPI } from '../../api';
import { Alert, Button, Card, CardHeader, PageLoader } from '../../components/ui';
import { GitBranch, RefreshCw, Database, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
});

const REFRESH_MS = 20000;

export default function ArchitectureUMLPage() {
  const [payload, setPayload] = useState(null);
  const [active, setActive] = useState('class');
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  const [svg, setSvg] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const diagramCode = useMemo(() => {
    if (!payload) return '';
    return active === 'class' ? payload.classDiagram : payload.erDiagram;
  }, [payload, active]);

  const fetchUml = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await architectureAPI.getUml('all');
      setPayload(res.data.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load UML diagrams';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUml();
  }, []);

  useEffect(() => {
    let timer = null;
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchUml();
      }, REFRESH_MS);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (!diagramCode) {
      setSvg('');
      return;
    }

    let mounted = true;

    const render = async () => {
      setRendering(true);
      try {
        const id = `uml-${active}-${Date.now()}`;
        const rendered = await mermaid.render(id, diagramCode);
        if (mounted) setSvg(rendered.svg);
      } catch (err) {
        if (mounted) {
          setSvg('');
          setError(`Mermaid render error: ${err.message}`);
        }
      } finally {
        if (mounted) setRendering(false);
      }
    };

    render();

    return () => {
      mounted = false;
    };
  }, [diagramCode, active]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reverse Engineering UML</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live diagrams generated from current code models and database schema
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={active === 'class' ? 'primary' : 'secondary'} icon={Layers} onClick={() => setActive('class')}>
            Class Diagram
          </Button>
          <Button variant={active === 'er' ? 'primary' : 'secondary'} icon={Database} onClick={() => setActive('er')}>
            ER Diagram
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchUml}>
            Refresh Now
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Dynamic UML"
          subtitle="Auto-refresh every 20 seconds keeps diagrams updated when schema/model code changes"
          actions={<GitBranch size={16} className="text-gray-400" />}
        />

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600 font-medium">Auto Refresh</label>
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`w-12 h-7 rounded-full relative transition-colors ${autoRefresh ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span className="text-xs text-gray-500">{autoRefresh ? 'Enabled' : 'Disabled'}</span>
        </div>

        {error && <Alert message={error} />}

        {loading ? (
          <PageLoader />
        ) : rendering ? (
          <div className="py-12">
            <PageLoader />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl bg-gradient-to-b from-white to-gray-50 p-4 overflow-auto">
            {svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <p className="text-sm text-gray-500">No diagram data available.</p>
            )}
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Mermaid source</p>
          <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-auto max-h-72">
            {diagramCode || 'No source available'}
          </pre>
        </div>
      </Card>
    </div>
  );
}
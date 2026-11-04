import React, { useState } from 'react';
import { Database, ShieldCheck, Network, Terminal, Check, Copy, Server, Cpu, Lock } from 'lucide-react';

export const CloudSqlGuide: React.FC = () => {
  const [copiedEnv, setCopiedEnv] = useState(false);

  const envSample = `# Google Cloud SQL PostgreSQL Environment Configuration

DB_HOST="10.128.0.3"                   # Cloud SQL Private IP
DB_PORT="5432"                         # PostgreSQL Port
DB_USER="postgres"                     # Database Username
DB_PASSWORD="YourSecureCloudSQLPassword" # Cloud SQL User Password
DB_NAME="scriptures"                   # Database Name
DB_SSLMODE="disable"                   # SSL Mode inside VPC
INSTANCE_CONNECTION_NAME="my-project:us-central1:scriptures-db"
PORT="3000"                            # HTTP Web Server Port`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2 uppercase">
          <span>Deployment & Connectivity Guide</span>
        </div>
        <h2 className="text-2xl font-bold font-serif mb-2">
          Google Cloud SQL PostgreSQL Setup
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Detailed instructions on environment variable configuration, Direct VPC Egress networking, 
          Cloud SQL Auth Proxy, and Go connection pool settings for the <span className="text-emerald-400 font-mono">scriptures</span> PostgreSQL database.
        </p>
      </div>

      {/* Environment Variables Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              1. Required Environment Variables
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set these variables in your deployment environment (Cloud Run, GKE, or systemd)
            </p>
          </div>
          <button
            onClick={copyEnv}
            className="px-3.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEnv ? 'Copied .env' : 'Copy .env Template'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Variable Name</th>
                <th className="py-3 px-4">Sample Value</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">DB_HOST</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">10.128.0.3 / 127.0.0.1</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  Private IP address of the Cloud SQL instance or 127.0.0.1 when using Proxy.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">DB_PORT</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">5432</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  PostgreSQL database port (default 5432).
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">DB_USER</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">postgres</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  Database user with read permissions on scriptures database.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">DB_PASSWORD</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">••••••••••••</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  Password for the database user.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">DB_NAME</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">scriptures</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  Name of the PostgreSQL database instance.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">DB_SSLMODE</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">disable / require</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  SSL encryption mode (\`disable\` inside private VPC, \`require\` if mandated).
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">INSTANCE_CONNECTION_NAME</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">proj:region:db-instance</td>
                <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                  GCP Cloud SQL connection identifier.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Connectivity & Architecture Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
            <Network className="w-5 h-5" />
            <span>Direct VPC Egress (Private IP)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Connects Google Cloud Run or GKE directly to Cloud SQL over Private IP within your Google Cloud VPC network without public internet traversal.
          </p>
          <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
            <div className="text-slate-500 mb-1"># Cloud Run Deployment Command:</div>
            <code className="text-emerald-400">
              gcloud run deploy scriptures-api \<br />
              &nbsp;&nbsp;--network=default \<br />
              &nbsp;&nbsp;--subnet=default \<br />
              &nbsp;&nbsp;--vpc-egress=all-traffic \<br />
              &nbsp;&nbsp;--set-env-vars DB_HOST="10.128.0.3",DB_PORT="5432"
            </code>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
            <Terminal className="w-5 h-5" />
            <span>Cloud SQL Auth Proxy (Local Dev)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Creates a secure local tunnel on localhost port 5432 for local Go server testing against your GCP Cloud SQL instance.
          </p>
          <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
            <div className="text-slate-500 mb-1"># Start Local Auth Proxy Tunnel:</div>
            <code className="text-emerald-400">
              ./cloud-sql-proxy --port 5432 \<br />
              &nbsp;&nbsp;my-project:us-central1:scriptures-db
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

import Footer from '@/components/interface/homescreen/footer';
import Header from '@/components/interface/homescreen/header';
import ShaderBackground from '@/components/interface/homescreen/shader-background';

export default function PrivacyPage() {
  return (
    <ShaderBackground>
        <Header />
      <div className="flex min-h-svh flex-col p-6 md:p-10 max-w-4xl mx-auto bg-card/25 filter backdrop-blur-md overflow-hidden rounded-xl mt-10 border border-border/50 shadow-xl">
        <div className="w-full mb-8 border-b pb-6">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="prose dark:prose-invert text-foreground w-full max-w-none">
          <h2>1. GNU AGPL v3 & Your Privacy</h2>
          <p>
            Netgoat is free software governed by the GNU Affero General Public License (AGPL) v3.0. Because our underlying source code is fully transparent, how your data is collected and processed is completely auditable by anyone in the source code.
          </p>
          <p>
            As a decentralized or privately-hostable network server software, your data privacy largely depends on the entity hosting the Netgoat instance you connect to. The core software is designed such that:
          </p>

          <h2>2. Transparent Data Processing</h2>
          <p>
            Any data you provide—such as email addresses during sign-up, OAuth profile identifiers, or domain routing settings—is collected strictly for the operational functionality of the software. Because the source is public under the AGPLv3, there are no hidden trackers or proprietary background routines collecting your data against your will. 
          </p>
          <p>The core application only collects:</p>
          <ul>
            <li><strong>Account Details:</strong> Necessary for identification, like emails, passwords, or linked OAuth data (GitHub, GitLab, Discord).</li>
            <li><strong>Technical Operations:</strong> IP addresses and system logs are processed for security, reverse proxying, and analytical telemetry specific to the host.</li>
          </ul>

          <h2>3. Cookies and Session Management</h2>
          <p>
            Netgoat uses standard functional cookies purely to maintain secure sessions across your browser and the server. There are no proprietary marketing trackers bundled in the core distribution.
          </p>

          <h2>4. Your Rights and Data Control</h2>
          <p>
            We process your personal information to deliver this network service based on legitimate operational interest and your clear consent. You retain the right to request deletion or export of your account data.
          </p>

          <h2>5. Instance-Specific Policies</h2>
          <p>
            If you are accessing an instance of Netgoat operated by a third-party host, that host may enforce their own administrative privacy practices. Please contact the administrator of your specific instance for data deletion requests, or you may deploy the AGPLv3-licensed software yourself to retain complete sovereignty over your data.
          </p>
        </div>
      </div>
            <Footer />
      
    </ShaderBackground>
  );
}

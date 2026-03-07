import Footer from '@/components/interface/homescreen/footer';
import Header from '@/components/interface/homescreen/header';
import ShaderBackground from '@/components/interface/homescreen/shader-background';

export default function TermsPage() {
  return (
    <ShaderBackground>
        <Header />
      <div className="flex min-h-svh flex-col p-6 md:p-10 max-w-4xl mx-auto bg-card/25 filter backdrop-blur-md overflow-hidden rounded-xl mt-10 border border-border/50 shadow-xl">
        <div className="w-full mb-8 border-b pb-6">
          <h1 className="text-4xl font-bold mb-2">Terms of Service & Licensing</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="prose dark:prose-invert text-foreground w-full max-w-none">
          <h2>1. Introduction</h2>
          <p>
            By accessing or using Netgoat, you agree to be bound by these Terms. The software powering Netgoat is distributed under the GNU Affero General Public License (AGPL) v3.0.
          </p>

          <h2>2. License Grant & Open Source</h2>
          <p>
            The software powering this platform is Free Software. Under the GNU AGPL v3.0, you are free to use, study, modify, and distribute the original software source code. However, you must:
          </p>
          <ul>
            <li>Provide a copy of the AGPLv3 when distributing the software or modifications.</li>
            <li>Make the complete source code available if you modify and run it as a network service.</li>
            <li>Retain all copyright and license notices.</li>
          </ul>

          <h2>3. Acceptable Use</h2>
          <p>
            You agree to use the service only for lawful purposes. You must not:
          </p>
          <ul>
            <li>Use the platform in any way that violates applicable local, national, or international law.</li>
            <li>Engage in malicious activities, unauthorized access, or distribution of destructive code.</li>
          </ul>

          <h2>4. Disclaimer of Warranty</h2>
          <p>
            <b>THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW. EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM AS IS WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING, REPAIR OR CORRECTION.</b>
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            <b>IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</b>
          </p>

          <h2>6. Contact</h2>
          <p>
            For questions about the terms or our open-source AGPL license, please refer to the project repository or contact the administrators.
          </p>
        </div>
      </div>
      <Footer />
    </ShaderBackground>
  );
}

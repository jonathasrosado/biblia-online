import React from 'react';

interface TermsPageProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

const TermsPage: React.FC<TermsPageProps> = ({ theme }) => {
    const isBw = theme === 'bw';

    return (
        <div className={`max-w-4xl mx-auto px-6 py-12 space-y-8 font-serif leading-relaxed
       ${isBw ? 'text-black' : 'text-stone-900 dark:text-stone-100'}
    `}>
            <h1 className={`text-3xl md:text-4xl font-bold mb-8 text-center
        ${isBw ? 'text-black uppercase tracking-wider' : 'text-bible-gold'}
      `}>Termos de Uso</h1>

            <section>
                <h2 className="text-2xl font-bold mb-4">1. Termos</h2>
                <p>Ao acessar ao site <strong className={isBw ? 'text-black' : 'text-bible-gold'}>Bíblia Online</strong>, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">2. Uso de Licença</h2>
                <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Bíblia Online , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>modificar ou copiar os materiais;</li>
                    <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
                    <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Bíblia Online;</li>
                    <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                    <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
                </ul>
                <p className="mt-4">Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por Bíblia Online a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">3. Isenção de responsabilidade</h2>
                <ol className="list-decimal pl-6 space-y-2">
                    <li>Os materiais no site da Bíblia Online são fornecidos 'como estão'. Bíblia Online não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.</li>
                    <li>Além disso, o Bíblia Online não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ​​ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.</li>
                </ol>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">4. Limitações</h2>
                <p>Em nenhum caso o Bíblia Online ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em Bíblia Online, mesmo que Bíblia Online ou um representante autorizado da Bíblia Online tenha sido notificado oralmente ou por escrito da possibilidade de tais danos.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">5. Precisão dos materiais</h2>
                <p>Os materiais exibidos no site da Bíblia Online podem incluir erros técnicos, tipográficos ou fotográficos. Bíblia Online não garante que qualquer material em seu site seja preciso, completo ou atual. Bíblia Online pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, Bíblia Online não se compromete a atualizar os materiais.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">6. Links</h2>
                <p>O Bíblia Online não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por Bíblia Online do site. O uso de qualquer site vinculado é por conta e risco do usuário.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">Modificações</h2>
                <p>O Bíblia Online pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">Lei aplicável</h2>
                <p>Estes termos e condições são regidos e interpretados de acordo com as leis do Bíblia Online e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.</p>
            </section>
        </div>
    );
};

export default TermsPage;

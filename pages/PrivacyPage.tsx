import React from 'react';

interface PrivacyPageProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ theme }) => {
    const isBw = theme === 'bw';

    return (
        <div className={`max-w-4xl mx-auto px-6 py-12 space-y-8 font-serif leading-relaxed
      ${isBw ? 'text-black' : 'text-stone-900 dark:text-stone-100'}
    `}>
            <h1 className={`text-3xl md:text-4xl font-bold mb-8 text-center
        ${isBw ? 'text-black uppercase tracking-wider' : 'text-bible-gold'}
      `}>Política de Privacidade</h1>

            <section>
                <p>A sua privacidade é importante para nós. É política do Bíblia Online respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Bíblia Online, e outros sites que possuímos e operamos.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">1. Informações que Coletamos</h2>
                <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.</p>
                <p className="mt-4">Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">2. Compartilhamento de Dados</h2>
                <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">3. Cookies e Publicidade (AdSense)</h2>
                <p>O Google, como fornecedor terceirizado, utiliza cookies para exibir anúncios. O uso do cookie DART permite que o Google veicule anúncios para nossos usuários com base em sua visita ao nosso site e a outros sites na Internet.</p>
                <p className="mt-4"><strong>Cookie DoubleClick Dart</strong></p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>O Google, como fornecedor de terceiros, utiliza cookies para exibir anúncios em nosso website;</li>
                    <li>Com o cookie DART, o Google pode exibir anúncios com base nas visitas que o leitor fez a outros websites na Internet;</li>
                    <li>Os usuários podem desativar o cookie DART visitando a Política de privacidade da rede de conteúdo e dos anúncios do Google.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">4. Links para Sites de Terceiros</h2>
                <p>O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">5. Compromisso do Usuário</h2>
                <p>O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o Bíblia Online oferece no site e com caráter enunciativo, mas não limitativo:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
                    <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
                    <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Bíblia Online, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 mt-8">6. Mais Informações</h2>
                <p>Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.</p>
                <p className={`mt-8 text-sm ${isBw ? 'text-black/60' : 'text-stone-500'}`}>Esta política é efetiva a partir de <strong>Dezembro/2025</strong>.</p>
            </section>
        </div>
    );
};

export default PrivacyPage;

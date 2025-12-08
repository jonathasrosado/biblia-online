export interface BibleFaq {
    id: string;
    question: string;
    answer: string;
    category: 'Geral' | 'Estudo' | 'Personagens' | 'Teologia' | 'Curiosidades';
}

export const bibleFaqs: BibleFaq[] = [
    // GERAL
    {
        id: '1',
        category: 'Geral',
        question: 'O que é a Bíblia?',
        answer: 'A Bíblia é a coleção de textos religiosos sagrados para o cristianismo, considerada por eles como divinamente inspirada e um registro da relação entre Deus e a humanidade.'
    },
    {
        id: '2',
        category: 'Geral',
        question: 'Quantos livros tem a Bíblia?',
        answer: 'A Bíblia Protestante contém 66 livros: 39 no Antigo Testamento e 27 no Novo Testamento. A Bíblia Católica contém 73 livros, incluindo os deuterocanônicos.'
    },
    {
        id: '3',
        category: 'Geral',
        question: 'Quem escreveu a Bíblia?',
        answer: 'A Bíblia foi escrita por cerca de 40 autores diferentes ao longo de aproximadamente 1500 anos, incluindo reis, pescadores, profetas, médicos e pastores, todos inspirados por Deus.'
    },
    {
        id: '4',
        category: 'Geral',
        question: 'Em quais línguas a Bíblia foi escrita originalmente?',
        answer: 'O Antigo Testamento foi escrito majoritariamente em hebraico (com trechos em aramaico), e o Novo Testamento foi escrito em grego koiné.'
    },
    {
        id: '5',
        category: 'Geral',
        question: 'Qual é a diferença entre o Antigo e o Novo Testamento?',
        answer: 'O Antigo Testamento narra a criação e a história da aliança de Deus com Israel antes de Cristo. O Novo Testamento foca na vida, morte, ressurreição de Jesus e no início da Igreja.'
    },
    {
        id: '6',
        category: 'Geral',
        question: 'Qual é o livro mais antigo da Bíblia?',
        answer: 'Muitos estudiosos acreditam que o livro de Jó seja o mais antigo em termos de conteúdo e escrita, embora Gênesis narre os eventos mais antigos (a Criação).'
    },
    {
        id: '7',
        category: 'Geral',
        question: 'Qual é o último livro da Bíblia?',
        answer: 'O último livro é o Apocalipse, escrito pelo apóstolo João, que contém profecias sobre o fim dos tempos e a vitória final de Cristo.'
    },
    {
        id: '8',
        category: 'Geral',
        question: 'O que significa a palavra "Bíblia"?',
        answer: 'A palavra "Bíblia" vem do grego "biblia", que significa "livros" ou "biblioteca", indicando que ela é uma coleção de vários escritos.'
    },
    {
        id: '9',
        category: 'Geral',
        question: 'O que são os Evangelhos?',
        answer: 'Os Evangelhos (Mateus, Marcos, Lucas e João) são os quatro primeiros livros do Novo Testamento que narram a vida, ministério, morte e ressurreição de Jesus Cristo.'
    },
    {
        id: '10',
        category: 'Geral',
        question: 'O que é o Pentateuco?',
        answer: 'Pentateuco refere-se aos cinco primeiros livros da Bíblia (Gênesis, Êxodo, Levítico, Números e Deuteronômio), escritos tradicionalmente por Moisés.'
    },

    // ESTUDO
    {
        id: '11',
        category: 'Estudo',
        question: 'Como devo começar a ler a Bíblia?',
        answer: 'Recomenda-se começar pelos Evangelhos, especialmente o Evangelho de João, pois apresenta claramente quem é Jesus e o plano da salvação.'
    },
    {
        id: '12',
        category: 'Estudo',
        question: 'Preciso ler a Bíblia na ordem?',
        answer: 'Não necessariamente. Embora a leitura cronológica ajude a entender a história, para fins devocionais e teológicos, pode-se intercalar Antigo e Novo Testamento.'
    },
    {
        id: '13',
        category: 'Estudo',
        question: 'Qual a melhor tradução da Bíblia para estudo?',
        answer: 'Para estudo profundo, versões como a Nova Almeida Atualizada (NAA) ou Almeida Revista e Atualizada (ARA) são ótimas. Para leitura fluida, NVI (Nova Versão Internacional) ou NVT.'
    },
    {
        id: '14',
        category: 'Estudo',
        question: 'O que é um devocional diário?',
        answer: 'É um tempo separado do dia para ler um trecho da Bíblia, meditar em seu significado e orar, visando o crescimento espiritual e a comunhão com Deus.'
    },
    {
        id: '15',
        category: 'Estudo',
        question: 'Como memorizar versículos bíblicos?',
        answer: 'Escreva o versículo em cartões, leia em voz alta repetidamente e tente aplicá-lo em oração. Associar o versículo a uma imagem ou música também ajuda.'
    },
    {
        id: '16',
        category: 'Estudo',
        question: 'O que são referências cruzadas?',
        answer: 'São indicações nas margens ou rodapés das Bíblias que apontam para outros versículos relacionados ao tema ou evento que está sendo lido.'
    },
    {
        id: '17',
        category: 'Estudo',
        question: 'O que significa "Selah" nos Salmos?',
        answer: 'É uma palavra hebraica que provavelmente indica uma pausa musical ou um momento para reflexão e meditação no que acabou de ser cantado/lido.'
    },
    {
        id: '18',
        category: 'Estudo',
        question: 'O que é exegese bíblica?',
        answer: 'Exegese é o estudo crítico e analítico de um texto bíblico para descobrir seu significado original, histórico e gramatical.'
    },
    {
        id: '19',
        category: 'Estudo',
        question: 'Quanto tempo leva para ler a Bíblia toda?',
        answer: 'Lendo cerca de 3 a 4 capítulos por dia (15-20 minutos), é possível ler a Bíblia inteira em exatamente um ano.'
    },
    {
        id: '20',
        category: 'Estudo',
        question: 'O que é uma Bíblia de Estudo?',
        answer: 'É uma edição da Bíblia que contém notas de rodapé, mapas, introduções aos livros e artigos teológicos para ajudar o leitor a compreender o contexto e o significado do texto.'
    },

    // PERSONAGENS
    {
        id: '21',
        category: 'Personagens',
        question: 'Quem foi Davi?',
        answer: 'Davi foi o segundo rei de Israel, conhecido por derrotar o gigante Golias, ser um grande salmista e ser chamado de "homem segundo o coração de Deus".'
    },
    {
        id: '22',
        category: 'Personagens',
        question: 'Quem foi Paulo de Tarso?',
        answer: 'Originalmente um perseguidor de cristãos, Paulo converteu-se após um encontro com Jesus e tornou-se o maior missionário do cristianismo, escrevendo grande parte do Novo Testamento.'
    },
    {
        id: '23',
        category: 'Personagens',
        question: 'Quem foi Moisés?',
        answer: 'Moisés foi o profeta escolhido por Deus para libertar o povo de Israel da escravidão no Egito e receber os Dez Mandamentos no Monte Sinai.'
    },
    {
        id: '24',
        category: 'Personagens',
        question: 'Quem foi Pedro?',
        answer: 'Pedro foi um pescador da Galileia que se tornou um dos doze apóstolos mais próximos de Jesus e uma das principais lideranças da igreja primitiva.'
    },
    {
        id: '25',
        category: 'Personagens',
        question: 'Quem foi Maria humanamente falando?',
        answer: 'Maria foi uma jovem judia de Nazaré escolhida por Deus para ser a mãe de Jesus Cristo, concebendo-o pelo poder do Espírito Santo.'
    },
    {
        id: '26',
        category: 'Personagens',
        question: 'Quem foi o homem mais forte da Bíblia?',
        answer: 'Sansão é descrito como o homem mais forte, recebendo força sobrenatural de Deus, mas perdendo-a ao quebrar seu voto de nazireu.'
    },
    {
        id: '27',
        category: 'Personagens',
        question: 'Quem foi o homem mais sábio da Bíblia?',
        answer: 'Salomão, filho de Davi, é conhecido por ter pedido sabedoria a Deus e ter se tornado o rei mais sábio e rico de sua época.'
    },
    {
        id: '28',
        category: 'Personagens',
        question: 'Quem foi Elias?',
        answer: 'Elias foi um grande profeta do Antigo Testamento que realizou milagres notáveis e foi levado aos céus em uma carruagem de fogo sem provar a morte física.'
    },
    {
        id: '29',
        category: 'Personagens',
        question: 'Quem traiu Jesus?',
        answer: 'Judas Iscariotes, um dos doze discípulos, traiu Jesus entregando-o às autoridades religiosas por trinta moedas de prata.'
    },
    {
        id: '30',
        category: 'Personagens',
        question: 'Quem negou Jesus três vezes?',
        answer: 'O apóstolo Pedro negou conhecer Jesus três vezes antes do galo cantar, cumprindo uma profecia feita pelo próprio Cristo.'
    },

    // TEOLOGIA
    {
        id: '31',
        category: 'Teologia',
        question: 'O que é a Trindade?',
        answer: 'A doutrina da Trindade afirma que há um só Deus eternamente existente em três pessoas distintas: o Pai, o Filho (Jesus) e o Espírito Santo.'
    },
    {
        id: '32',
        category: 'Teologia',
        question: 'O que é a Salvação?',
        answer: 'Salvação é a libertação do pecado e suas consequências eternas, recebida pela graça de Deus através da fé no sacrifício de Jesus Cristo.'
    },
    {
        id: '33',
        category: 'Teologia',
        question: 'O que é o Pecado?',
        answer: 'Pecado é qualquer ação, sentimento ou pensamento que vai contra a lei e a vontade de Deus, separando o ser humano de seu Criador.'
    },
    {
        id: '34',
        category: 'Teologia',
        question: 'O que é Fé?',
        answer: 'Segundo Hebreus 11:1, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos. É confiar plenamente em Deus.'
    },
    {
        id: '35',
        category: 'Teologia',
        question: 'O que a Bíblia diz sobre o céu?',
        answer: 'O céu é descrito como a morada de Deus, um lugar de paz perfeita, alegria eterna e ausência de dor, onde os salvos viverão para sempre com Cristo.'
    },
    {
        id: '36',
        category: 'Teologia',
        question: 'O que é o Batismo?',
        answer: 'O batismo é um sacramento ou ordenança que simboliza a purificação dos pecados, a morte para a velha vida e a ressurreição para uma nova vida em Cristo.'
    },
    {
        id: '37',
        category: 'Teologia',
        question: 'Jesus é Deus?',
        answer: 'Sim, o cristianismo ortodoxo afirma que Jesus é plenamente Deus e plenamente homem, a segunda pessoa da Trindade encarnada.'
    },
    {
        id: '38',
        category: 'Teologia',
        question: 'O que é a Graça?',
        answer: 'Graça é o favor imerecido de Deus. É Deus dando aos seres humanos o que eles não merecem (salvação e perdão), baseado em Seu amor.'
    },
    {
        id: '39',
        category: 'Teologia',
        question: 'O que é o Arrebatamento?',
        answer: 'É um evento escatológico em que se acredita que os cristãos vivos e os mortos ressuscitados serão levados para encontrar Cristo nos ares.'
    },
    {
        id: '40',
        category: 'Teologia',
        question: 'O que são Anjos?',
        answer: 'Anjos são seres espirituais criados por Deus para servi-Lo como mensageiros e para proteger e ministrar a favor dos seres humanos.'
    },

    // CURIOSIDADES
    {
        id: '41',
        category: 'Curiosidades',
        question: 'Qual é o versículo mais curto da Bíblia?',
        answer: 'Em muitas traduções é João 11:35: "Jesus chorou". Outras consideram Êxodo 20:13 ("Não matarás") dependendo da contagem de palavras no original.'
    },
    {
        id: '42',
        category: 'Curiosidades',
        question: 'Qual é o maior capítulo da Bíblia?',
        answer: 'O Salmo 119 é o capítulo mais longo, com 176 versículos, todos exaltando a Palavra de Deus.'
    },
    {
        id: '43',
        category: 'Curiosidades',
        question: 'Qual é o capítulo mais curto da Bíblia?',
        answer: 'O Salmo 117, com apenas 2 versículos.'
    },
    {
        id: '44',
        category: 'Curiosidades',
        question: 'Quantas promessas existem na Bíblia?',
        answer: 'Estima-se que existam mais de 7.000 ou 8.000 promessas de Deus para a humanidade espalhadas por toda a Bíblia.'
    },
    {
        id: '45',
        category: 'Curiosidades',
        question: 'A palavra "Trindade" está na Bíblia?',
        answer: 'Não, a palavra "Trindade" não aparece nas Escrituras, embora o conceito teológico seja claramente ensinado através da divindade do Pai, do Filho e do Espírito.'
    },
    {
        id: '46',
        category: 'Curiosidades',
        question: 'Matusalém foi o homem mais velho?',
        answer: 'Sim, Matusalém viveu 969 anos, sendo a pessoa mais velha mencionada na Bíblia (Gênesis 5:27).'
    },
    {
        id: '47',
        category: 'Curiosidades',
        question: 'Quem escreveu Apocalipse?',
        answer: 'O livro do Apocalipse foi escrito pelo apóstolo João enquanto estava exilado na ilha de Patmos.'
    },
    {
        id: '48',
        category: 'Curiosidades',
        question: 'Qual idioma Jesus falava?',
        answer: 'Historicamente, Jesus falava aramaico, a língua comum da Judeia na época, mas provavelmente também entendia hebraico (língua das escrituras) e talvez grego.'
    },
    {
        id: '49',
        category: 'Curiosidades',
        question: 'Onde está a Arca da Aliança hoje?',
        answer: 'O destino final da Arca da Aliança é um mistério bíblico e histórico. Ela desapareceu dos registros bíblicos antes da destruição do Templo pelos babilônios.'
    },
    {
        id: '50',
        category: 'Curiosidades',
        question: 'Quantas palavras tem a Bíblia?',
        answer: 'Isso varia muito conforme a tradução e o idioma. No original (hebraico/grego), são cerca de 600.000 palavras. Em português, varia entre 700.000 a 800.000.'
    },
    {
        id: '51',
        category: 'Curiosidades',
        question: 'O que é o Maná?',
        answer: 'Maná foi o alimento sobrenatural que Deus forneceu aos israelitas durante os 40 anos de peregrinação no deserto.'
    }
];

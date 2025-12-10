const apiKey = "AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0";

async function listModels() {
    try {
        console.log("Tentando listar modelos via API REST...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.models) {
            console.log("Modelos disponíveis:");
            const imagenModels = data.models.filter(m => m.name.includes('imagen') || (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateImage')));

            if (imagenModels.length > 0) {
                console.log("IMAGEN ENCONTRADO!");
                imagenModels.forEach(m => console.log(`- ${m.name} (${m.version})`));
            } else {
                console.log("Nenhum modelo Imagen encontrado na lista pública.");
                // Listar alguns outros para confirmar
                data.models.slice(0, 5).forEach(m => console.log(`- ${m.name}`));
            }
        } else {
            console.log("Erro ao listar modelos:", data);
        }

    } catch (error) {
        console.error("Erro:", error.message);
    }
}

listModels();

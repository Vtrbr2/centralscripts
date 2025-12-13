
  // Carrega o arquivo JSON
  async function carregarGabarito() {
  try {
    const response = await fetch("src/end/task_76781679.json");
    const questoes = await response.json();

    const container = document.getElementById("gabarito");

    questoes.forEach(q => {
      const card = document.createElement("div");
      card.classList.add("question-card");

      // Cabeçalho
      const header = document.createElement("div");
      header.classList.add("question-header");

      const titulo = document.createElement("h3");
      titulo.textContent = `Questão ${q.questao_numero}`;

      const id = document.createElement("span");
      id.classList.add("question-id");
      id.textContent = `#${q.id_da_questao}`;

      header.appendChild(titulo);
      header.appendChild(id);

      // Enunciado
      const enunciado = document.createElement("p");
      enunciado.classList.add("question-enunciado");
      enunciado.textContent = q.enunciado;

      card.appendChild(header);
      card.appendChild(enunciado);

      // Imagem do enunciado (se existir)
      if (q.imagem_url) {
        const img = document.createElement("img");
        img.src = q.imagem_url;
        img.alt = "Imagem da questão";
        img.classList.add("question-image");
        card.appendChild(img);
      }

      // Resposta correta
      const respostaDiv = document.createElement("div");
      respostaDiv.classList.add("question-resposta");

      const letra = Object.keys(q.alternativa_correta)[0];
      let valor = q.alternativa_correta[letra];

      // Se a resposta contiver "[IMAGEM]" ou parecer uma URL/base64 de imagem
      if (typeof valor === "string" && (valor.includes("http") || valor.startsWith("data:image"))) {
        // Remove marcador [IMAGEM] se existir
        valor = valor.replace("[IMAGEM]", "").trim();

        respostaDiv.innerHTML = `<strong>Resposta [${letra}]:</strong><br>`;
        const img = document.createElement("img");
        img.src = valor;
        img.alt = "Resposta correta";
        img.classList.add("answer-image");
        respostaDiv.appendChild(img);
      } else {
        respostaDiv.innerHTML = `<strong>Resposta [${letra}]:</strong> ${valor}`;
      }

      card.appendChild(respostaDiv);

      container.appendChild(card);
    });

  } catch (error) {
    console.error("Erro ao carregar gabarito:", error);
  }
}

document.addEventListener("DOMContentLoaded", carregarGabarito);
//document.addEventListener("DOMContentLoaded", function() {
//    const now = new Date();

    // Datas e horários específicos
 //   const schedule = [
     //   { date: "2025-12-13", startHour: 13, endHour: 15 },
    //    { date: "2025-12-13", startHour: 13, endHour: 15 }
 //   ];

 //   let allowed = false;

 //   for (const s of schedule) {
    //    const start = new Date(`${s.date}T${String(s.startHour).padStart(2, '0')}:00:00`);
     //   const end = new Date(`${s.date}T${String(s.endHour).padStart(2, '0')}:00:00`);

      //  if (now >= start && now <= end) {
            // Dentro do horário permitido
         //   allowed = true;
        //    const timeUntilEnd = end - now;
          //  document.getElementById("loader").style.display = "none";
        //    document.getElementById("content").style.display = "block";

            // Fechar automaticamente ao passar das 15:00
        //    setTimeout(() => {
           //     document.getElementById("loader").style.display = "block";
            //    document.getElementById("content").style.display = "none";
         //   }, timeUntilEnd);
         //   break;
      //  } else if (now < start) {
            // Antes do horário: agendar liberação
          //  const timeUntilStart = start - now;
          //  setTimeout(() => {
              //  document.getElementById("loader").style.display = "none";
               // document.getElementById("content").style.display = "block";

                // Fechar automaticamente ao passar das 15:00
               // const timeUntilEnd = end - start;
               // setTimeout(() => {
                  //  document.getElementById("loader").style.display = "block";
                //    document.getElementById("content").style.display = "none";
               // }, timeUntilEnd);
        //    }, timeUntilStart);
         //   allowed = true;
       //     break;
     //   }
 //   }

    // Fora do período permitido
 //   if (!allowed) {
    //    document.getElementById("loader").style.display = "block";
    //    document.getElementById("content").style.display = "none";
//    }
//});

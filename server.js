
const express = require("express");
const os = require("os");
const { randomUUID } = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
const s3 = new S3Client({ region: "us-east-1" });

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <h1>MercadoAndino v2</h1>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        main {
          background: #fff;
          padding: 40px;
          border-radius: 12px;
          max-width: 500px;
          width: 85%;
          box-shadow: 0 5px 25px #0001;
        }
        h1 { color: #176448; }
        button {
          padding: 12px 20px;
          background: #176448;
          border: 0;
          border-radius: 6px;
          color: white;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <main>
        <h1>MercadoAndino v2</h1>
        <p>Plataforma escalable en AWS</p>
        <p>Servidor: ${os.hostname()}</p>
        <h3>Subir fotografía a S3</h3>
        <input type="file" id="foto" accept="image/png,image/jpeg">
        <p><button onclick="subir()">Subir fotografía</button></p>
        <p id="resultado"></p>
      </main>
      <script>
        async function subir() {
          const file = document.getElementById("foto").files[0];
          const resultado = document.getElementById("resultado");

          if (!file) {
            resultado.textContent = "Selecciona una fotografía";
            return;
          }

          if (!["image/jpeg", "image/png"].includes(file.type)) {
            resultado.textContent = "Solo archivos JPG o PNG";
            return;
          }

          try {
            resultado.textContent = "Subiendo...";

            const params = new URLSearchParams({
              name: file.name,
              type: file.type
            });

            const response = await fetch("/api/upload-url?" + params);

            if (!response.ok) {
              throw new Error("No se pudo generar la URL");
            }

            const data = await response.json();

            const upload = await fetch(data.url, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file
            });

            if (!upload.ok) {
              throw new Error("No se pudo subir la imagen");
            }

            resultado.textContent = "Fotografía subida correctamente";
          } catch (error) {
            resultado.textContent = error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

app.get("/api/upload-url", async (req, res) => {
  try {
    const type = String(req.query.type || "");

    if (!["image/jpeg", "image/png"].includes(type)) {
      return res.status(400).json({
        error: "Formato no permitido"
      });
    }

    if (!process.env.BUCKET) {
      return res.status(500).json({
        error: "Bucket no configurado"
      });
    }

    const ext = type === "image/png" ? ".png" : ".jpg";
    const key = `uploads/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: key,
      ContentType: type
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 300
    });

    res.json({ url, key });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al generar la URL"
    });
  }
});

app.listen(process.env.PORT || 80, "0.0.0.0");

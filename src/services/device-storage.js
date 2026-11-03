const endpoint = "/api/storage";

async function request(options) {
  let response;
  try {
    response = await fetch(endpoint, { cache: "no-store", ...options });
  } catch {
    throw new Error("Não foi possível contactar o servidor local. Inicie a aplicação com npm run dev ou npm start e tente novamente.");
  }
  let body;
  try { body = await response.json(); }
  catch { throw new Error("O armazenamento do dispositivo não está disponível. Abra a aplicação através do servidor local."); }
  if (!response.ok) {
    const error = new Error(body.error ?? "Não foi possível aceder aos dados do dispositivo.");
    error.status = response.status;
    throw error;
  }
  return body;
}

export function saveDeviceData(data, revision) {
  return request({
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, revision }),
  });
}

// A new hotel always starts clean; browser data is never imported automatically.
export function loadDeviceData() {
  return request();
}

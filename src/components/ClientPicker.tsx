import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.tsx";

export function ClientPicker({ clients, initial = "" }: { clients: string[]; initial?: string }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(clients.includes(initial) ? initial : "");
  return <>
    {clients.length > 0 && <label>{t("Cliente")}
      <select value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">{t("Novo cliente")}</option>
        {clients.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>}
    {selected ? <input type="hidden" name="owner" value={selected} /> : <label>{t("Nome do tutor")}
      <input name="owner" required maxLength={100} defaultValue={initial} />
    </label>}
    <p className="hint">{t("Um cliente pode ter vários cães. Selecione o cliente para associar mais um cão.")}</p>
  </>;
}

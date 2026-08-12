import { fmtDay } from "@/lib/dates";
import { schema } from "@/lib/db";
import { SubmitButton } from "@/components/submit-button";
import {
  addEquipment,
  addServiceRecord,
  removeEquipment,
  removeServiceRecord,
} from "./equipment-actions";
import { EquipmentCard } from "./equipment-card";

type Equipment = typeof schema.equipment.$inferSelect;
type ServiceRecord = typeof schema.serviceRecords.$inferSelect;

function money(cents: number | null) {
  if (cents === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function EquipmentSection({
  equipment,
  records,
  editor,
}: {
  equipment: Equipment[];
  records: ServiceRecord[];
  editor: boolean;
}) {
  const recordsByEquipment = new Map<number, ServiceRecord[]>();
  for (const record of records) {
    const group = recordsByEquipment.get(record.equipmentId) ?? [];
    group.push(record);
    recordsByEquipment.set(record.equipmentId, group);
  }

  return (
    <section className="mt-8 border-t border-sand-line pt-7">
      <p className="section-label">Equipment &amp; service records</p>
      <h2 className="font-display mt-1 text-2xl">Know the history of the house</h2>
      <p className="mt-1 max-w-3xl text-sm text-ink-soft">
        Keep model information, warranty dates, service providers, costs, and
        maintenance history together for each major piece of equipment.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {equipment.map((item) => {
          const itemRecords = recordsByEquipment.get(item.id) ?? [];
          return (
            <EquipmentCard
              key={item.id}
              name={item.name}
              category={item.category ?? "Equipment"}
              location={item.location}
              serviceRecordCount={itemRecords.length}
            >
              <div className="p-4 pt-3 sm:p-0">
                <div className="flex items-start justify-between gap-3">
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    {item.category ?? "Equipment"}
                  </p>
                  <h3 className="font-display mt-1 text-xl">{item.name}</h3>
                </div>
                {editor ? (
                  <form action={removeEquipment}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-ink-faint hover:text-rust"
                    >
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>

              <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                {item.location ? (
                  <div>
                    <dt className="text-xs text-ink-faint">Location</dt>
                    <dd>{item.location}</dd>
                  </div>
                ) : null}
                {item.manufacturer || item.model ? (
                  <div>
                    <dt className="text-xs text-ink-faint">Make and model</dt>
                    <dd>{[item.manufacturer, item.model].filter(Boolean).join(" · ")}</dd>
                  </div>
                ) : null}
                {item.serialNumber ? (
                  <div>
                    <dt className="text-xs text-ink-faint">Serial number</dt>
                    <dd>{item.serialNumber}</dd>
                  </div>
                ) : null}
                {item.installedOn ? (
                  <div>
                    <dt className="text-xs text-ink-faint">Installed</dt>
                    <dd>{fmtDay(item.installedOn)}</dd>
                  </div>
                ) : null}
                {item.warrantyUntil ? (
                  <div>
                    <dt className="text-xs text-ink-faint">Warranty through</dt>
                    <dd>{fmtDay(item.warrantyUntil)}</dd>
                  </div>
                ) : null}
              </dl>
              {item.notes ? (
                <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">
                  {item.notes}
                </p>
              ) : null}

              <div className="mt-4 border-t border-sand-line pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Service history
                </p>
                <ul className="mt-2">
                  {itemRecords.map((record) => (
                    <li
                      key={record.id}
                      className="flex gap-3 border-t border-sand-line py-2 first:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {record.serviceType}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {fmtDay(record.servicedOn)}
                          {record.provider ? ` · ${record.provider}` : ""}
                          {money(record.costCents)
                            ? ` · ${money(record.costCents)}`
                            : ""}
                        </p>
                        {record.notes ? (
                          <p className="mt-1 text-xs text-ink-faint">
                            {record.notes}
                          </p>
                        ) : null}
                      </div>
                      {editor ? (
                        <form action={removeServiceRecord}>
                          <input type="hidden" name="id" value={record.id} />
                          <button
                            type="submit"
                            aria-label={`Remove ${record.serviceType} service record`}
                            className="text-xs text-ink-faint hover:text-rust"
                          >
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                  {itemRecords.length === 0 ? (
                    <li className="py-2 text-sm text-ink-soft">
                      No service has been recorded yet.
                    </li>
                  ) : null}
                </ul>

                {editor ? (
                  <form action={addServiceRecord} className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="equipmentId" value={item.id} />
                    <label>
                      <span className="flabel">Service date</span>
                      <input name="servicedOn" type="date" required className="field py-2" />
                    </label>
                    <label>
                      <span className="flabel">Work performed</span>
                      <input
                        name="serviceType"
                        required
                        maxLength={200}
                        className="field py-2"
                        placeholder="Annual tune-up"
                      />
                    </label>
                    <label>
                      <span className="flabel">Service provider</span>
                      <input name="provider" maxLength={200} className="field py-2" />
                    </label>
                    <label>
                      <span className="flabel">Cost</span>
                      <input
                        name="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        className="field py-2"
                        placeholder="0.00"
                      />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="flabel">Service notes</span>
                      <textarea name="notes" rows={2} maxLength={4000} className="field" />
                    </label>
                    <div className="sm:col-span-2">
                      <SubmitButton className="btn btn-quiet py-2">
                        Add service record
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}
              </div>
              </div>
            </EquipmentCard>
          );
        })}
        {equipment.length === 0 ? (
          <p className="text-sm text-ink-soft">No equipment has been added yet.</p>
        ) : null}
      </div>

      {editor ? (
        <div className="card mt-6 p-6">
          <p className="section-label">Add equipment</p>
          <form action={addEquipment} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input aria-label="Equipment name" name="name" required maxLength={200} className="field" placeholder="Water heater" />
            <input aria-label="Equipment category" name="category" maxLength={120} className="field" placeholder="Category" />
            <input aria-label="Equipment location" name="location" maxLength={200} className="field" placeholder="Location" />
            <input aria-label="Equipment manufacturer" name="manufacturer" maxLength={200} className="field" placeholder="Manufacturer" />
            <input aria-label="Equipment model" name="model" maxLength={200} className="field" placeholder="Model" />
            <input aria-label="Equipment serial number" name="serialNumber" maxLength={200} className="field" placeholder="Serial number" />
            <label>
              <span className="flabel">Installed</span>
              <input name="installedOn" type="date" className="field" />
            </label>
            <label>
              <span className="flabel">Warranty through</span>
              <input name="warrantyUntil" type="date" className="field" />
            </label>
            <textarea
              aria-label="Equipment notes"
              name="notes"
              rows={2}
              maxLength={4000}
              className="field sm:col-span-2 lg:col-span-3"
              placeholder="Filter sizes, service notes, or anything else worth keeping"
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <SubmitButton>Add equipment</SubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

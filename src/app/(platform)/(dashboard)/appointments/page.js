import { getExpertAppointments } from "@/actions/appointments";
import AppointmentsClient from "./client";

export const metadata = {
  title: "Appointments | Dashboard",
};

export default async function AppointmentsPage() {
  const { data } = await getExpertAppointments();

  return <AppointmentsClient initialData={data} />;
}
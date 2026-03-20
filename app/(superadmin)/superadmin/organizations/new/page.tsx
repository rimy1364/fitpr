import { OrgOnboardingForm } from "@/components/superadmin/OrgOnboardingForm";

export const metadata = { title: "New Organization" };

export default function NewOrgPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboard New Organization</h1>
        <p className="text-muted-foreground">
          Create a new fitness organization and send an invite to the admin.
        </p>
      </div>
      <OrgOnboardingForm />
    </div>
  );
}

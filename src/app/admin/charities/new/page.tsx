import { CharityEditor } from "../charity-form";

export default function NewCharityPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Add charity</h1>
      <p className="mt-2 text-muted-foreground">
        Subscribers will see this in the directory and during signup.
      </p>
      <div className="mt-8">
        <CharityEditor />
      </div>
    </div>
  );
}

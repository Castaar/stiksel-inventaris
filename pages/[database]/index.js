import { databaseRedirect } from "../../lib/legacy-urls";

export default function DatabaseRedirect() {
  return null;
}

export const getServerSideProps = databaseRedirect;

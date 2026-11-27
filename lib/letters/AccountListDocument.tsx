import "server-only";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Database } from "@/types/database";

type AccountListRow = Pick<
  Database["public"]["Tables"]["pengguna"]["Row"],
  "email" | "nama_lengkap" | "peran" | "username"
>;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937",
    paddingTop: 98,
    paddingBottom: 42,
    paddingHorizontal: 36,
  },
  title: {
    position: "absolute",
    top: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  subtitle: {
    position: "absolute",
    top: 48,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 9,
    color: "#555555",
  },
  privacyNote: {
    position: "absolute",
    top: 66,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: "#555555",
  },
  tableHeader: {
    position: "absolute",
    top: 88,
    left: 36,
    right: 36,
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 5,
    backgroundColor: "#f3f4f6",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
  },
  name: { width: "34%" },
  username: { width: "24%" },
  email: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    textAlign: "right",
    fontSize: 8,
    color: "#555555",
  },
});

export function AccountListDocument({
  accounts,
  roleLabel,
  generatedAt,
}: {
  accounts: AccountListRow[];
  roleLabel: string;
  generatedAt: string;
}) {
  return (
    <Document title={`Daftar Akun ${roleLabel}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text fixed style={styles.title}>
          Daftar Akun {roleLabel}
        </Text>
        <Text fixed style={styles.subtitle}>
          Dibuat pada {generatedAt}
        </Text>
        <Text fixed style={styles.privacyNote}>
          Berisi data pribadi. Simpan dan bagikan dokumen ini dengan aman.
        </Text>
        <View fixed style={styles.tableHeader}>
          <Text style={styles.name}>Nama lengkap</Text>
          <Text style={styles.username}>Username</Text>
          <Text style={styles.email}>Email</Text>
        </View>

        {accounts.map((account) => (
          <View key={account.username} style={styles.row} wrap={false}>
            <Text style={styles.name}>{account.nama_lengkap}</Text>
            <Text style={styles.username}>{account.username}</Text>
            <Text style={styles.email}>{account.email}</Text>
          </View>
        ))}

        <Text
          fixed
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Halaman ${pageNumber} dari ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

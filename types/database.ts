export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      dokumen: {
        Row: {
          catatan: string | null
          diunggah_oleh: string
          diunggah_pada: string
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          file_name: string | null
          file_path: string
          id: string
          jenis: Database["public"]["Enums"]["jenis_dokumen"]
          mime_type: string | null
          pengajuan_id: string
          status: Database["public"]["Enums"]["status_verifikasi"]
          ukuran: number | null
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          diunggah_oleh: string
          diunggah_pada?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          jenis: Database["public"]["Enums"]["jenis_dokumen"]
          mime_type?: string | null
          pengajuan_id: string
          status?: Database["public"]["Enums"]["status_verifikasi"]
          ukuran?: number | null
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          diunggah_oleh?: string
          diunggah_pada?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_dokumen"]
          mime_type?: string | null
          pengajuan_id?: string
          status?: Database["public"]["Enums"]["status_verifikasi"]
          ukuran?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dokumen_diunggah_oleh_fkey"
            columns: ["diunggah_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dokumen_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dokumen_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
        ]
      }
      guru: {
        Row: {
          created_at: string
          id: string
          jabatan: string | null
          jurusan_id: string | null
          nip: string | null
          nuptk: string | null
          pengguna_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jabatan?: string | null
          jurusan_id?: string | null
          nip?: string | null
          nuptk?: string | null
          pengguna_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jabatan?: string | null
          jurusan_id?: string | null
          nip?: string | null
          nuptk?: string | null
          pengguna_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guru_jurusan_id_fkey"
            columns: ["jurusan_id"]
            isOneToOne: false
            referencedRelation: "jurusan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: true
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      instruktur: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          jabatan: string | null
          pengguna_id: string
          peran: Database["public"]["Enums"]["peran_instruktur"]
          perusahaan_id: string
          telepon: string | null
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          jabatan?: string | null
          pengguna_id: string
          peran?: Database["public"]["Enums"]["peran_instruktur"]
          perusahaan_id: string
          telepon?: string | null
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          jabatan?: string | null
          pengguna_id?: string
          peran?: Database["public"]["Enums"]["peran_instruktur"]
          perusahaan_id?: string
          telepon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruktur_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instruktur_perusahaan_id_fkey"
            columns: ["perusahaan_id"]
            isOneToOne: false
            referencedRelation: "perusahaan"
            referencedColumns: ["id"]
          },
        ]
      }
      jurnal: {
        Row: {
          created_at: string
          deskripsi: string | null
          foto_path: string | null
          id: string
          kegiatan: string
          pengajuan_id: string | null
          ringkasan_ai: string | null
          siswa_id: string
          status: Database["public"]["Enums"]["status_jurnal"]
          tanggal: string
          updated_at: string
          waktu_mulai: string | null
          waktu_selesai: string | null
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          foto_path?: string | null
          id?: string
          kegiatan: string
          pengajuan_id?: string | null
          ringkasan_ai?: string | null
          siswa_id: string
          status?: Database["public"]["Enums"]["status_jurnal"]
          tanggal: string
          updated_at?: string
          waktu_mulai?: string | null
          waktu_selesai?: string | null
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          foto_path?: string | null
          id?: string
          kegiatan?: string
          pengajuan_id?: string | null
          ringkasan_ai?: string | null
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_jurnal"]
          tanggal?: string
          updated_at?: string
          waktu_mulai?: string | null
          waktu_selesai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurnal_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurnal_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      jurusan: {
        Row: {
          created_at: string
          id: string
          kode: string | null
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode?: string | null
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kode?: string | null
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      log_aktivitas: {
        Row: {
          aksi: string
          created_at: string
          detail: Json | null
          entitas: string
          entitas_id: string | null
          id: string
          pengguna_id: string | null
        }
        Insert: {
          aksi: string
          created_at?: string
          detail?: Json | null
          entitas: string
          entitas_id?: string | null
          id?: string
          pengguna_id?: string | null
        }
        Update: {
          aksi?: string
          created_at?: string
          detail?: Json | null
          entitas?: string
          entitas_id?: string | null
          id?: string
          pengguna_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_aktivitas_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      mutabaah_form: {
        Row: {
          created_at: string
          deskripsi: string | null
          dibuat_oleh: string | null
          id: string
          nama: string
          periode_id: string | null
          status: Database["public"]["Enums"]["status_form"]
          updated_at: string
          versi: number
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          dibuat_oleh?: string | null
          id?: string
          nama: string
          periode_id?: string | null
          status?: Database["public"]["Enums"]["status_form"]
          updated_at?: string
          versi?: number
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          dibuat_oleh?: string | null
          id?: string
          nama?: string
          periode_id?: string | null
          status?: Database["public"]["Enums"]["status_form"]
          updated_at?: string
          versi?: number
        }
        Relationships: [
          {
            foreignKeyName: "mutabaah_form_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutabaah_form_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periode_pkl"
            referencedColumns: ["id"]
          },
        ]
      }
      mutabaah_harian: {
        Row: {
          catatan: string | null
          created_at: string
          form_id: string
          id: string
          siswa_id: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          form_id: string
          id?: string
          siswa_id: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          form_id?: string
          id?: string
          siswa_id?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutabaah_harian_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_form"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutabaah_harian_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      mutabaah_jawaban: {
        Row: {
          created_at: string
          harian_id: string
          id: string
          jawaban_angka: number | null
          jawaban_boolean: boolean | null
          jawaban_teks: string | null
          pertanyaan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          harian_id: string
          id?: string
          jawaban_angka?: number | null
          jawaban_boolean?: boolean | null
          jawaban_teks?: string | null
          pertanyaan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          harian_id?: string
          id?: string
          jawaban_angka?: number | null
          jawaban_boolean?: boolean | null
          jawaban_teks?: string | null
          pertanyaan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutabaah_jawaban_harian_id_fkey"
            columns: ["harian_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_harian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutabaah_jawaban_pertanyaan_id_fkey"
            columns: ["pertanyaan_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_pertanyaan"
            referencedColumns: ["id"]
          },
        ]
      }
      mutabaah_jawaban_opsi: {
        Row: {
          created_at: string
          id: string
          jawaban_id: string
          opsi_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jawaban_id: string
          opsi_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jawaban_id?: string
          opsi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutabaah_jawaban_opsi_jawaban_id_fkey"
            columns: ["jawaban_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_jawaban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutabaah_jawaban_opsi_opsi_id_fkey"
            columns: ["opsi_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_opsi"
            referencedColumns: ["id"]
          },
        ]
      }
      mutabaah_opsi: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          label: string
          nilai: string | null
          pertanyaan_id: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          label: string
          nilai?: string | null
          pertanyaan_id: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          label?: string
          nilai?: string | null
          pertanyaan_id?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "mutabaah_opsi_pertanyaan_id_fkey"
            columns: ["pertanyaan_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_pertanyaan"
            referencedColumns: ["id"]
          },
        ]
      }
      mutabaah_pertanyaan: {
        Row: {
          aktif: boolean
          created_at: string
          deskripsi: string | null
          form_id: string
          id: string
          max_angka: number | null
          min_angka: number | null
          pertanyaan: string
          satuan: string | null
          tipe: Database["public"]["Enums"]["tipe_pertanyaan"]
          updated_at: string
          urutan: number
          wajib: boolean
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          form_id: string
          id?: string
          max_angka?: number | null
          min_angka?: number | null
          pertanyaan: string
          satuan?: string | null
          tipe?: Database["public"]["Enums"]["tipe_pertanyaan"]
          updated_at?: string
          urutan?: number
          wajib?: boolean
        }
        Update: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          form_id?: string
          id?: string
          max_angka?: number | null
          min_angka?: number | null
          pertanyaan?: string
          satuan?: string | null
          tipe?: Database["public"]["Enums"]["tipe_pertanyaan"]
          updated_at?: string
          urutan?: number
          wajib?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mutabaah_pertanyaan_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "mutabaah_form"
            referencedColumns: ["id"]
          },
        ]
      }
      notifikasi: {
        Row: {
          created_at: string
          dibaca: boolean
          id: string
          judul: string
          pengguna_id: string
          pesan: string
          tautan: string | null
        }
        Insert: {
          created_at?: string
          dibaca?: boolean
          id?: string
          judul: string
          pengguna_id: string
          pesan: string
          tautan?: string | null
        }
        Update: {
          created_at?: string
          dibaca?: boolean
          id?: string
          judul?: string
          pengguna_id?: string
          pesan?: string
          tautan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifikasi_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      orang_tua_siswa: {
        Row: {
          created_at: string
          hubungan: Database["public"]["Enums"]["hubungan_ortu"]
          id: string
          pengguna_id: string
          siswa_id: string
        }
        Insert: {
          created_at?: string
          hubungan?: Database["public"]["Enums"]["hubungan_ortu"]
          id?: string
          pengguna_id: string
          siswa_id: string
        }
        Update: {
          created_at?: string
          hubungan?: Database["public"]["Enums"]["hubungan_ortu"]
          id?: string
          pengguna_id?: string
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orang_tua_siswa_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orang_tua_siswa_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajuan_anggota: {
        Row: {
          created_at: string
          id: string
          pengajuan_id: string
          peran: Database["public"]["Enums"]["peran_anggota"]
          siswa_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pengajuan_id: string
          peran?: Database["public"]["Enums"]["peran_anggota"]
          siswa_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pengajuan_id?: string
          peran?: Database["public"]["Enums"]["peran_anggota"]
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_anggota_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_anggota_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajuan_pkl: {
        Row: {
          alasan_penolakan: string | null
          catatan: string | null
          created_at: string
          dibuat_oleh: string
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          guru_pembimbing_id: string | null
          id: string
          instruktur_id: string | null
          pembimbing_id: string | null
          periode_id: string
          perusahaan_id: string
          status: Database["public"]["Enums"]["status_pengajuan"]
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          updated_at: string
        }
        Insert: {
          alasan_penolakan?: string | null
          catatan?: string | null
          created_at?: string
          dibuat_oleh: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          guru_pembimbing_id?: string | null
          id?: string
          instruktur_id?: string | null
          pembimbing_id?: string | null
          periode_id: string
          perusahaan_id: string
          status?: Database["public"]["Enums"]["status_pengajuan"]
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Update: {
          alasan_penolakan?: string | null
          catatan?: string | null
          created_at?: string
          dibuat_oleh?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          guru_pembimbing_id?: string | null
          id?: string
          instruktur_id?: string | null
          pembimbing_id?: string | null
          periode_id?: string
          perusahaan_id?: string
          status?: Database["public"]["Enums"]["status_pengajuan"]
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_pkl_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_pkl_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_pkl_guru_pembimbing_id_fkey"
            columns: ["guru_pembimbing_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_pkl_instruktur_id_fkey"
            columns: ["instruktur_id"]
            isOneToOne: false
            referencedRelation: "instruktur"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_pkl_pembimbing_id_fkey"
            columns: ["pembimbing_id"]
            isOneToOne: false
            referencedRelation: "instruktur"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_pkl_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periode_pkl"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_pkl_perusahaan_id_fkey"
            columns: ["perusahaan_id"]
            isOneToOne: false
            referencedRelation: "perusahaan"
            referencedColumns: ["id"]
          },
        ]
      }
      pengaturan_sekolah: {
        Row: {
          akreditasi: string | null
          alamat: string
          email: string | null
          footer_path: string | null
          format_nomor_surat: string | null
          id: number
          kepala_sekolah: string | null
          kop_path: string | null
          logo_path: string | null
          nama_sekolah: string
          nip_kepala: string | null
          telepon: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          akreditasi?: string | null
          alamat: string
          email?: string | null
          footer_path?: string | null
          format_nomor_surat?: string | null
          id?: number
          kepala_sekolah?: string | null
          kop_path?: string | null
          logo_path?: string | null
          nama_sekolah: string
          nip_kepala?: string | null
          telepon?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          akreditasi?: string | null
          alamat?: string
          email?: string | null
          footer_path?: string | null
          format_nomor_surat?: string | null
          id?: number
          kepala_sekolah?: string | null
          kop_path?: string | null
          logo_path?: string | null
          nama_sekolah?: string
          nip_kepala?: string | null
          telepon?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pengguna: {
        Row: {
          aktif: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nama_lengkap: string
          peran: Database["public"]["Enums"]["peran_pengguna"]
          telepon: string | null
          updated_at: string
          username: string
        }
        Insert: {
          aktif?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nama_lengkap: string
          peran: Database["public"]["Enums"]["peran_pengguna"]
          telepon?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          aktif?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nama_lengkap?: string
          peran?: Database["public"]["Enums"]["peran_pengguna"]
          telepon?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      penilaian: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          nilai: number | null
          pengajuan_id: string
          penilai_id: string
          peran: Database["public"]["Enums"]["peran_penilai"]
          siswa_id: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          nilai?: number | null
          pengajuan_id: string
          penilai_id: string
          peran: Database["public"]["Enums"]["peran_penilai"]
          siswa_id: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          nilai?: number | null
          pengajuan_id?: string
          penilai_id?: string
          peran?: Database["public"]["Enums"]["peran_penilai"]
          siswa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penilaian_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_penilai_id_fkey"
            columns: ["penilai_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      penomoran_surat: {
        Row: {
          id: string
          jenis: Database["public"]["Enums"]["jenis_surat"]
          tahun: number
          updated_at: string
          urutan_terakhir: number
        }
        Insert: {
          id?: string
          jenis: Database["public"]["Enums"]["jenis_surat"]
          tahun: number
          updated_at?: string
          urutan_terakhir?: number
        }
        Update: {
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_surat"]
          tahun?: number
          updated_at?: string
          urutan_terakhir?: number
        }
        Relationships: []
      }
      periode_pkl: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          nama: string
          tahun_ajaran: string
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          nama: string
          tahun_ajaran: string
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          nama?: string
          tahun_ajaran?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          updated_at?: string
        }
        Relationships: []
      }
      perusahaan: {
        Row: {
          aktif: boolean
          alamat: string
          created_at: string
          email: string | null
          id: string
          kota: string | null
          nama: string
          telepon: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          aktif?: boolean
          alamat: string
          created_at?: string
          email?: string | null
          id?: string
          kota?: string | null
          nama: string
          telepon?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          aktif?: boolean
          alamat?: string
          created_at?: string
          email?: string | null
          id?: string
          kota?: string | null
          nama?: string
          telepon?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sertifikat: {
        Row: {
          created_at: string
          dibuat_oleh: string | null
          file_path: string | null
          id: string
          nomor: string
          pengajuan_id: string | null
          siswa_id: string
          tanggal_terbit: string
        }
        Insert: {
          created_at?: string
          dibuat_oleh?: string | null
          file_path?: string | null
          id?: string
          nomor: string
          pengajuan_id?: string | null
          siswa_id: string
          tanggal_terbit: string
        }
        Update: {
          created_at?: string
          dibuat_oleh?: string | null
          file_path?: string | null
          id?: string
          nomor?: string
          pengajuan_id?: string | null
          siswa_id?: string
          tanggal_terbit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sertifikat_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sertifikat_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sertifikat_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      siswa: {
        Row: {
          aktif: boolean
          alamat: string | null
          created_at: string
          id: string
          jurusan_id: string | null
          kelas: string | null
          nama_orangtua: string | null
          nis: string
          nisn: string | null
          pengguna_id: string
          tanggal_lahir: string | null
          telepon: string | null
          telepon_orangtua: string | null
          tempat_lahir: string | null
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          alamat?: string | null
          created_at?: string
          id?: string
          jurusan_id?: string | null
          kelas?: string | null
          nama_orangtua?: string | null
          nis: string
          nisn?: string | null
          pengguna_id: string
          tanggal_lahir?: string | null
          telepon?: string | null
          telepon_orangtua?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          alamat?: string | null
          created_at?: string
          id?: string
          jurusan_id?: string | null
          kelas?: string | null
          nama_orangtua?: string | null
          nis?: string
          nisn?: string | null
          pengguna_id?: string
          tanggal_lahir?: string | null
          telepon?: string | null
          telepon_orangtua?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_jurusan_id_fkey"
            columns: ["jurusan_id"]
            isOneToOne: false
            referencedRelation: "jurusan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: true
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      surat: {
        Row: {
          created_at: string
          dibuat_oleh: string | null
          file_path: string | null
          id: string
          jenis: Database["public"]["Enums"]["jenis_surat"]
          kode_verifikasi: string | null
          nomor: string | null
          pengajuan_id: string
          status: Database["public"]["Enums"]["status_surat"]
          tanggal_terbit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dibuat_oleh?: string | null
          file_path?: string | null
          id?: string
          jenis: Database["public"]["Enums"]["jenis_surat"]
          kode_verifikasi?: string | null
          nomor?: string | null
          pengajuan_id: string
          status?: Database["public"]["Enums"]["status_surat"]
          tanggal_terbit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dibuat_oleh?: string | null
          file_path?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_surat"]
          kode_verifikasi?: string | null
          nomor?: string | null
          pengajuan_id?: string
          status?: Database["public"]["Enums"]["status_surat"]
          tanggal_terbit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surat_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surat_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
        ]
      }
      tugas: {
        Row: {
          created_at: string
          deadline: string | null
          deskripsi: string | null
          guru_id: string
          id: string
          judul: string
          pengajuan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          deskripsi?: string | null
          guru_id: string
          id?: string
          judul: string
          pengajuan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          deskripsi?: string | null
          guru_id?: string
          id?: string
          judul?: string
          pengajuan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tugas_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tugas_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_pkl"
            referencedColumns: ["id"]
          },
        ]
      }
      tugas_siswa: {
        Row: {
          catatan: string | null
          created_at: string
          file_path: string | null
          id: string
          selesai_pada: string | null
          siswa_id: string
          status: Database["public"]["Enums"]["status_tugas"]
          tugas_id: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          selesai_pada?: string | null
          siswa_id: string
          status?: Database["public"]["Enums"]["status_tugas"]
          tugas_id: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          selesai_pada?: string | null
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_tugas"]
          tugas_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tugas_siswa_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tugas_siswa_tugas_id_fkey"
            columns: ["tugas_id"]
            isOneToOne: false
            referencedRelation: "tugas"
            referencedColumns: ["id"]
          },
        ]
      }
      verifikasi_jurnal: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          jurnal_id: string
          peran: Database["public"]["Enums"]["peran_verifikator"]
          status: Database["public"]["Enums"]["status_verifikasi"]
          updated_at: string
          verifikator_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          jurnal_id: string
          peran: Database["public"]["Enums"]["peran_verifikator"]
          status?: Database["public"]["Enums"]["status_verifikasi"]
          updated_at?: string
          verifikator_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          jurnal_id?: string
          peran?: Database["public"]["Enums"]["peran_verifikator"]
          status?: Database["public"]["Enums"]["status_verifikasi"]
          updated_at?: string
          verifikator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifikasi_jurnal_jurnal_id_fkey"
            columns: ["jurnal_id"]
            isOneToOne: false
            referencedRelation: "jurnal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifikasi_jurnal_verifikator_id_fkey"
            columns: ["verifikator_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_grade: { Args: { target: string }; Returns: boolean }
      can_manage_tugas: { Args: { target: string }; Returns: boolean }
      can_verify_jurnal: { Args: { target: string }; Returns: boolean }
      can_view_jawaban: { Args: { target: string }; Returns: boolean }
      can_view_jurnal: { Args: { target: string }; Returns: boolean }
      can_view_mutabaah: { Args: { target: string }; Returns: boolean }
      can_view_pengajuan: { Args: { target: string }; Returns: boolean }
      can_view_siswa: { Args: { target: string }; Returns: boolean }
      current_guru_id: { Args: never; Returns: string }
      current_siswa_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["peran_pengguna"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_pengajuan_member: { Args: { target: string }; Returns: boolean }
      is_pengajuan_owner: { Args: { target: string }; Returns: boolean }
      is_siswa_in_pengajuan: {
        Args: { target_pengajuan: string; target_siswa: string }
        Returns: boolean
      }
    }
    Enums: {
      hubungan_ortu: "ayah" | "ibu" | "wali"
      jenis_dokumen:
        | "izin_orang_tua_ttd"
        | "surat_balasan_perusahaan"
        | "surat_pernyataan"
        | "dokumen_pendukung"
        | "lainnya"
      jenis_surat:
        | "izin_orang_tua"
        | "pernyataan"
        | "pengajuan"
        | "keberangkatan"
        | "tugas_monitoring"
        | "perjanjian"
        | "penarikan"
      peran_anggota: "ketua" | "anggota"
      peran_instruktur: "instruktur" | "pembimbing"
      peran_pengguna: "admin" | "guru" | "siswa" | "instruktur" | "ortu"
      peran_penilai: "guru" | "instruktur"
      peran_verifikator: "guru" | "instruktur"
      status_form: "draft" | "aktif" | "arsip"
      status_jurnal:
        | "menunggu"
        | "terverifikasi_guru"
        | "terverifikasi_instruktur"
        | "revisi"
      status_pengajuan:
        | "draft"
        | "diajukan"
        | "izin_ortu_terbit"
        | "izin_ortu_diunggah"
        | "pengajuan_terbit"
        | "balasan_diunggah"
        | "diterima"
        | "keberangkatan_terbit"
        | "berlangsung"
        | "penarikan_terbit"
        | "selesai"
        | "ditolak"
        | "dibatalkan"
      status_surat: "draft" | "terbit" | "dibatalkan"
      status_tugas: "belum" | "selesai" | "terlambat"
      status_verifikasi: "menunggu" | "diterima" | "revisi" | "ditolak"
      tipe_pertanyaan:
        | "ya_tidak"
        | "pilih_satu"
        | "pilih_banyak"
        | "isian_singkat"
        | "isian_angka"
        | "essay"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      hubungan_ortu: ["ayah", "ibu", "wali"],
      jenis_dokumen: [
        "izin_orang_tua_ttd",
        "surat_balasan_perusahaan",
        "surat_pernyataan",
        "dokumen_pendukung",
        "lainnya",
      ],
      jenis_surat: [
        "izin_orang_tua",
        "pernyataan",
        "pengajuan",
        "keberangkatan",
        "tugas_monitoring",
        "perjanjian",
        "penarikan",
      ],
      peran_anggota: ["ketua", "anggota"],
      peran_instruktur: ["instruktur", "pembimbing"],
      peran_pengguna: ["admin", "guru", "siswa", "instruktur", "ortu"],
      peran_penilai: ["guru", "instruktur"],
      peran_verifikator: ["guru", "instruktur"],
      status_form: ["draft", "aktif", "arsip"],
      status_jurnal: [
        "menunggu",
        "terverifikasi_guru",
        "terverifikasi_instruktur",
        "revisi",
      ],
      status_pengajuan: [
        "draft",
        "diajukan",
        "izin_ortu_terbit",
        "izin_ortu_diunggah",
        "pengajuan_terbit",
        "balasan_diunggah",
        "diterima",
        "keberangkatan_terbit",
        "berlangsung",
        "penarikan_terbit",
        "selesai",
        "ditolak",
        "dibatalkan",
      ],
      status_surat: ["draft", "terbit", "dibatalkan"],
      status_tugas: ["belum", "selesai", "terlambat"],
      status_verifikasi: ["menunggu", "diterima", "revisi", "ditolak"],
      tipe_pertanyaan: [
        "ya_tidak",
        "pilih_satu",
        "pilih_banyak",
        "isian_singkat",
        "isian_angka",
        "essay",
      ],
    },
  },
} as const

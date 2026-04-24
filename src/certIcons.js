import { Eye, Pill, Barcode, Tag, FileSearch } from 'lucide-react';

export const CERT_ICONS = {
  'Avsyning':                Eye,
  'Kapselresaren':           Pill,
  'Serialisering':           Barcode,
  'Etikettering':            Tag,
  'Granskning/uttag av dok': FileSearch,
};

export const CERT_COLORS = {
  'Avsyning':                'var(--coral)',
  'Kapselresaren':           'var(--indigo)',
  'Serialisering':           '#2DD4BF',
  'Etikettering':            'var(--yellow)',
  'Granskning/uttag av dok': '#60A5FA',
};

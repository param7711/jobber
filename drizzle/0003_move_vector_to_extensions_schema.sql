-- Extensions in `public` pollute the exposed namespace. Move it while the
-- embeddings table is still empty, when the change is free.
ALTER EXTENSION vector SET SCHEMA extensions;

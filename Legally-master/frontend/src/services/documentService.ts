// Document Service for managing user-generated documents
//
// To create the required table in Supabase, run this SQL in your Supabase SQL editor:
//
// CREATE TABLE user_documents (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   doc_id TEXT,
//   doc_url TEXT,
//   title TEXT NOT NULL,
//   content TEXT NOT NULL,
//   document_type TEXT,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Create indexes for better performance
// CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
// CREATE INDEX idx_user_documents_created_at ON user_documents(created_at DESC);
// CREATE INDEX idx_user_documents_document_type ON user_documents(document_type);

import { supabase } from '../lib/supabase';

export interface UserDocument {
  id: string;
  user_id: string;
  doc_id?: string;
  doc_url?: string;
  title: string;
  content: string;
  document_type?: string;
  created_at: string;
}

export class DocumentService {
  private static instance: DocumentService;

  private constructor() {}

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  public async saveDocument(
    userId: string,
    title: string,
    content: string,
    documentType?: string,
    docId?: string,
    docUrl?: string
  ): Promise<UserDocument> {
    const { data, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: userId,
        doc_id: docId,
        doc_url: docUrl,
        title: title,
        content: content,
        document_type: documentType,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save document: ${error.message}`);
    }

    return data;
  }

  public async updateDocument(
    documentId: string,
    updates: Partial<{
      doc_id: string;
      doc_url: string;
      title: string;
      content: string;
    }>
  ): Promise<UserDocument> {
    const { data, error } = await supabase
      .from('user_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }

    return data;
  }

  public async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data || [];
  }

  public async deleteDocument(userId: string, documentId: string): Promise<void> {
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('user_id', userId)
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}
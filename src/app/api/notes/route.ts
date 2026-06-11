import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: Fetch all notes from DB sorted by updated date descending
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const notes = await db
      .collection('notes')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    // Remove mongodb specific _id
    const sanitizedNotes = notes.map(({ _id, ...rest }) => rest);
    return NextResponse.json(sanitizedNotes);
  } catch (error: any) {
    console.error('API GET notes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upsert a note by its unique ID
export async function POST(request: Request) {
  try {
    const note = await request.json();
    if (!note.id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Ensure metadata
    note.updatedAt = new Date().toISOString();
    if (!note.title) {
      note.title = 'Untitled Note';
    }

    await db.collection('notes').updateOne(
      { id: note.id },
      { $set: note },
      { upsert: true }
    );

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('API POST notes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a note by its unique ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection('notes').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE notes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

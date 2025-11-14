import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT update test case
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { input, expectedOutput } = body;

    const testCase = await prisma.testCase.update({
      where: { id },
      data: {
        input,
        expectedOutput,
      },
    });

    return NextResponse.json(testCase);
  } catch (error) {
    console.error('Error updating test case:', error);
    return NextResponse.json(
      { error: 'Failed to update test case' },
      { status: 500 }
    );
  }
}

// DELETE test case
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.testCase.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Error deleting test case:', error);
    return NextResponse.json(
      { error: 'Failed to delete test case' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single problem
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: true,
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problem' },
      { status: 500 }
    );
  }
}

// PUT update problem
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, exampleInput, exampleOutput, functionName, parameters, returnType } = body;

    if (!functionName || !parameters || !returnType) {
      return NextResponse.json(
        { error: 'functionName, parameters, and returnType are required' },
        { status: 400 }
      );
    }

    // Validate parameters is valid JSON
    let parsedParams;
    try {
      parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
      if (!Array.isArray(parsedParams) || parsedParams.length === 0) {
        return NextResponse.json(
          { error: 'Parameters must be a non-empty array' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid parameters format' },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.update({
      where: { id },
      data: {
        title,
        description,
        exampleInput,
        exampleOutput,
        functionName,
        parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters),
        returnType,
      },
    });

    return NextResponse.json(problem);
  } catch (error) {
    console.error('Error updating problem:', error);
    return NextResponse.json(
      { error: 'Failed to update problem' },
      { status: 500 }
    );
  }
}

// DELETE problem
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.problem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    return NextResponse.json(
      { error: 'Failed to delete problem' },
      { status: 500 }
    );
  }
}


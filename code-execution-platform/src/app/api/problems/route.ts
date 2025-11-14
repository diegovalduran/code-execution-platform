import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all problems
export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        testCases: true,
        _count: {
          select: { submissions: true }
        }
      }
    });
    return NextResponse.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}

// POST create new problem
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, exampleInput, exampleOutput, functionName, parameters, returnType } = body;

    if (!title || !description || !exampleInput || !exampleOutput || !functionName || !parameters || !returnType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, exampleInput, exampleOutput, functionName, parameters, and returnType are required' },
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

    const problem = await prisma.problem.create({
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

    return NextResponse.json(problem, { status: 201 });
  } catch (error) {
    console.error('Error creating problem:', error);
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }
    );
  }
}


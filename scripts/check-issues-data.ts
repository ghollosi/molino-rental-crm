import { db } from '../src/lib/db'

async function checkIssuesData() {
  console.log('🔍 Checking issues data...')
  
  try {
    // Count total issues
    const totalIssues = await db.issue.count()
    console.log(`📊 Total issues: ${totalIssues}`)
    
    if (totalIssues === 0) {
      console.log('❌ No issues found in database!')
      return
    }
    
    // Get sample issues
    const sampleIssues = await db.issue.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true
      }
    })
    
    console.log('\n📋 Sample issues:')
    sampleIssues.forEach(issue => {
      console.log(`- ${issue.title} (${issue.category}, ${issue.priority}, ${issue.status})`)
    })
    
    // Group by category
    const categoryCounts = await db.issue.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })
    
    console.log('\n📊 Issues by category:')
    categoryCounts.forEach(item => {
      console.log(`- ${item.category}: ${item._count.id}`)
    })
    
    // Check category enum values
    const uniqueCategories = await db.issue.findMany({
      select: { category: true },
      distinct: ['category']
    })
    
    console.log('\n🏷️ Unique categories in DB:')
    uniqueCategories.forEach(item => {
      console.log(`- ${item.category}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkIssuesData()
export const availableDonations=(state)=>state.donations.filter(d=>d.status==='available');
export const donorDonations=(state,id)=>state.donations.filter(d=>d.donorId===id);
export const matchExplanation=(d)=>[`${d.distance} km away`,`Matches ${d.category.toLowerCase()} needs`,`${d.quantity} ${d.unit} available`];
